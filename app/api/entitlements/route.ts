import { NextResponse } from 'next/server';
import { readDeviceEntitlements } from '@/lib/directory-store';
import { getClientKey } from '@/lib/rate-limit';
import { consumeRateLimit } from '@/lib/rate-limit-durable';
import { serializePlace } from '@/lib/serialize-place';

export const dynamic = 'force-dynamic';

const MAX_CHECKS = 60;
const WINDOW_MS = 10 * 60 * 1000;

// Same shape check as /api/unlock: the app only ever sends UUID().uuidString.
const DEVICE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The answer is one device's private places. No cache between here and the phone
// may keep it: a stale copy would outlive the code that granted it.
const NO_STORE = { 'Cache-Control': 'no-store' };

function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/**
 * What this device still has access to. Called by the app on launch.
 *
 * This is the only thing that makes revocation and expiry reach a phone. The app
 * keeps the unlocked compounds in its Keychain and the vetted places in a cache
 * file; before this existed it never asked the server again, so ending a code
 * deleted rows and no device ever noticed.
 *
 * It reads the device's own redemptions and returns nothing a fresh unlock would
 * not have given the same device. An unknown device id gets an empty list, which
 * is also what a revoked one gets -- there is nothing here to probe. Limits are
 * loose compared with /api/unlock because this is a routine launch call, not a
 * guess at a secret.
 */
export async function POST(request: Request) {
  // JSON only, as on /api/unlock: a text/plain POST needs no CORS preflight, so
  // any web page could spend guests' shared IP budget from its visitors' browsers.
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
  const deviceId = typeof value.device_id === 'string' ? value.device_id.trim() : '';
  if (!deviceId || !DEVICE_ID.test(deviceId)) {
    return reply({ error: 'device_id is required.' }, 400);
  }

  // IP first, and a refused request stops there, so a caller inventing a device
  // id per request is turned away without writing a bucket for each one.
  const ipLimit = await consumeRateLimit(`entitlements:ip:${getClientKey(request)}`, {
    max: MAX_CHECKS,
    windowMs: WINDOW_MS
  });
  const deviceLimit = ipLimit.allowed
    ? await consumeRateLimit(`entitlements:device:${deviceId}`, { max: MAX_CHECKS, windowMs: WINDOW_MS })
    : null;
  if (!ipLimit.allowed || !deviceLimit?.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, deviceLimit?.retryAfterSeconds ?? 0);
    return reply({ error: 'Too many requests. Please try again later.' }, 429, {
      'Retry-After': String(Math.max(1, retryAfter))
    });
  }

  try {
    const entitlements = await readDeviceEntitlements(deviceId);
    return reply({
      compounds: entitlements.map((item) => ({
        compound_slug: item.slug,
        places: item.places.map(serializePlace)
      }))
    });
  } catch (error) {
    console.error('Entitlement check failed', error);
    return reply({ error: 'Could not check access.' }, 500);
  }
}
