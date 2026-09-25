import { NextResponse } from 'next/server';
import { redeemCode, readVettedPlaces } from '@/lib/directory-store';
import { normalizeCode } from '@/lib/directory-taxonomy';
import { getClientKey } from '@/lib/rate-limit';
import { consumeRateLimit } from '@/lib/rate-limit-durable';
import { serializePlace } from '@/lib/serialize-place';

export const dynamic = 'force-dynamic';

const MAX_FAILURES = 10;
// Every attempt from one address, right or wrong, never refunded. Only a ceiling
// on correct-code requests (which the failure bucket gives back): set far above
// any compound's busiest check-in, so guests behind one Wi-Fi never meet it.
const MAX_ATTEMPTS_PER_IP = 60;
const WINDOW_MS = 10 * 60 * 1000;

// The app generates its device id with UUID().uuidString and keeps it in the
// Keychain; it has never sent anything else. Anything that isn't one is not the
// app, and would only become rate-limit keys and redemption rows.
const DEVICE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Private places and a per-device answer: nothing between here and the phone may keep a copy.
const NO_STORE = { 'Cache-Control': 'no-store' };

function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/**
 * Exchanges a compound code for that compound's private ("needs code") places.
 *
 * Rules this route must keep:
 *  1. The 404 body is byte-identical for "no such code", "code is inactive" and
 *     "code has ended". A distinguishable error tells someone brute-forcing which
 *     guesses are real, so `redeemCode` collapses all of them to null and we
 *     never branch on why.
 *  2. Limited per IP *and* per device id, in Postgres rather than process memory
 *     (an in-process count hands out a fresh budget on every deploy). The IP
 *     buckets are taken first and a refused request stops there: it is checked
 *     against no code and writes no device bucket, so a caller inventing a new
 *     device id per request cannot grow the table.
 *  3. Only wrong codes spend the shared failure budget. The attempt is counted
 *     BEFORE the code is looked up -- so a caller already over the limit is
 *     refused without the guess ever being checked, and fifty requests fired at
 *     once cannot all slip in under a limit they have not yet been charged for --
 *     and a correct code then gets its IP attempt back. A whole compound on one
 *     Wi-Fi (or one carrier NAT) redeeming on the same afternoon costs the shared
 *     failure bucket nothing; only its typos count.
 *  4. Correct codes are still capped, just loosely. Each one writes a permanent
 *     `redemptions` row per (code, device id), and the device id is whatever the
 *     caller sends -- so with the refund alone, anyone holding one real code could
 *     loop it with a fresh id per request, growing that table without limit and
 *     inflating the phone count staff use to spot an over-shared code. The
 *     every-attempt IP bucket (MAX_ATTEMPTS_PER_IP, never refunded) bounds that
 *     per address, and the device bucket is not refunded either: one phone
 *     making more than ten unlock attempts in ten minutes is not a guest.
 *  5. JSON only. Without this a text/plain POST is a CORS "simple request", so
 *     any web page could make every visitor's browser another guessing IP. A
 *     JSON body forces a preflight, which fails: this route sends no CORS headers.
 *
 * The tradeoff, written down so nobody tightens the wrong thing: codes are
 * GOLD-XX-XXXX over a 31-character alphabet, 31^6 ≈ 8.9e8 codes. At 10 wrong
 * guesses per IP per 10 minutes, one address gets ~1,440 guesses a day; with 50
 * live codes the first hit takes ~1.8e7 guesses, ~12,000 address-days (a
 * thousand addresses for twelve days). The device-id bucket adds nothing against
 * that -- the id is the caller's choice -- it is there to stop one phone looping.
 * The every-attempt bucket adds nothing either (it is six times looser); it caps
 * the correct-code loop in rule 4 at 60 per address per 10 minutes. Before
 * refunds, every attempt was held to 10; 60 keeps the loop within the same order
 * while leaving a busy compound's shared Wi-Fi plenty of room.
 * There is deliberately no site-wide failure cap: one attacker could spend it and
 * lock every guest at every compound out. If the odds above ever look too
 * generous, make codes longer (lib/compound-code.ts and normalizeCode) rather
 * than making the shared limits stricter.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^application\/json\b/i.test(contentType.trim())) {
    return reply({ error: 'Content-Type must be application/json.' }, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ error: 'Invalid request body.' }, 400);
  }

  const value = (body ?? {}) as Record<string, unknown>;
  const rawCode = typeof value.code === 'string' ? value.code : '';
  const deviceId = typeof value.device_id === 'string' ? value.device_id.trim() : '';

  if (!rawCode.trim() || !deviceId) {
    return reply({ error: 'Code and device_id are required.' }, 400);
  }
  if (!DEVICE_ID.test(deviceId)) {
    return reply({ error: 'Invalid device_id.' }, 400);
  }

  const ip = getClientKey(request);
  const limits = { max: MAX_FAILURES, windowMs: WINDOW_MS };
  // The loose ceiling first: it is never refunded, so it is spent by every
  // request that reaches this point, refused or not (rule 4).
  const allLimit = await consumeRateLimit(`unlock:ip:all:${ip}`, {
    max: MAX_ATTEMPTS_PER_IP,
    windowMs: WINDOW_MS
  });
  if (!allLimit.allowed) {
    return tooMany(allLimit.retryAfterSeconds);
  }
  const ipLimit = await consumeRateLimit(`unlock:ip:${ip}`, limits);
  if (!ipLimit.allowed) {
    return tooMany(ipLimit.retryAfterSeconds);
  }
  const deviceLimit = await consumeRateLimit(`unlock:device:${deviceId}`, limits);
  if (!deviceLimit.allowed) {
    // Refused before any code was checked, so this was not a guess: the shared
    // failure bucket gets its attempt back.
    await ipLimit.refund();
    return tooMany(deviceLimit.retryAfterSeconds);
  }

  try {
    const compound = await redeemCode(normalizeCode(rawCode), deviceId);
    if (!compound) {
      // Identical response for unknown, inactive and ended codes. Do not add detail here.
      // Every bucket stays spent: this is the only outcome the limits exist to count.
      return reply({ error: 'Invalid code.' }, 404);
    }
    // Only the shared failure bucket is refunded. The device bucket and the
    // every-attempt bucket keep this one (rule 4).
    await ipLimit.refund();
    const places = await readVettedPlaces(compound.id);
    return reply({
      compound_slug: compound.slug,
      compound: { slug: compound.slug, name_en: compound.nameEn, name_ar: compound.nameAr },
      places: places.map(serializePlace)
    });
  } catch (error) {
    console.error('Unlock failed', error);
    return reply({ error: 'Could not unlock. Please try again.' }, 500);
  }
}

function tooMany(retryAfterSeconds: number) {
  return reply({ error: 'Too many attempts. Please try again later.' }, 429, {
    'Retry-After': String(Math.max(1, retryAfterSeconds))
  });
}
