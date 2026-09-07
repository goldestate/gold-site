import { NextResponse } from 'next/server';
import { redeemCode, readVettedPlaces } from '@/lib/directory-store';
import { normalizeCode } from '@/lib/directory-taxonomy';
import { getClientKey } from '@/lib/rate-limit';
import { consumeRateLimit } from '@/lib/rate-limit-durable';
import { serializePlace } from '@/lib/serialize-place';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Exchanges a compound code for that compound's vetted places.
 *
 * Two rules this route must keep:
 *  1. The 404 body is byte-identical for "no such code" and "code is inactive".
 *     A distinguishable error tells someone brute-forcing which prefixes are real,
 *     so `redeemCode` collapses both cases to null and we never branch on why.
 *  2. Limited per IP *and* per device id. IP alone is trivially bypassed by
 *     rotating networks; device id alone is attacker-chosen. Either tripping is a 429.
 *     The counters live in Postgres, not in process memory: an in-process count
 *     hands out a fresh budget on every deploy and restart, which for the one
 *     endpoint guarding the code space is the same as not counting at all.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const value = (body ?? {}) as Record<string, unknown>;
  const rawCode = typeof value.code === 'string' ? value.code : '';
  const deviceId = typeof value.device_id === 'string' ? value.device_id.trim() : '';

  if (!rawCode.trim() || !deviceId) {
    return NextResponse.json({ error: 'Code and device_id are required.' }, { status: 400 });
  }
  if (deviceId.length > 100) {
    return NextResponse.json({ error: 'Invalid device_id.' }, { status: 400 });
  }

  const [ipLimit, deviceLimit] = await Promise.all([
    consumeRateLimit(`unlock:ip:${getClientKey(request)}`, { max: MAX_ATTEMPTS, windowMs: WINDOW_MS }),
    consumeRateLimit(`unlock:device:${deviceId}`, { max: MAX_ATTEMPTS, windowMs: WINDOW_MS })
  ]);
  if (!ipLimit.allowed || !deviceLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, deviceLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const compound = await redeemCode(normalizeCode(rawCode), deviceId);
    if (!compound) {
      // Identical response for unknown and inactive codes. Do not add detail here.
      return NextResponse.json({ error: 'Invalid code.' }, { status: 404 });
    }
    const places = await readVettedPlaces(compound.id);
    return NextResponse.json({
      compound_slug: compound.slug,
      compound: { slug: compound.slug, name_en: compound.nameEn, name_ar: compound.nameAr },
      places: places.map(serializePlace)
    });
  } catch (error) {
    console.error('Unlock failed', error);
    return NextResponse.json({ error: 'Could not unlock. Please try again.' }, { status: 500 });
  }
}
