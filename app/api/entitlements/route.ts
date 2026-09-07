import { NextResponse } from 'next/server';
import { readDeviceEntitlements } from '@/lib/directory-store';
import { getClientKey } from '@/lib/rate-limit';
import { consumeRateLimit } from '@/lib/rate-limit-durable';
import { serializePlace } from '@/lib/serialize-place';

export const dynamic = 'force-dynamic';

const MAX_CHECKS = 60;
const WINDOW_MS = 10 * 60 * 1000;

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const value = (body ?? {}) as Record<string, unknown>;
  const deviceId = typeof value.device_id === 'string' ? value.device_id.trim() : '';
  if (!deviceId || deviceId.length > 100) {
    return NextResponse.json({ error: 'device_id is required.' }, { status: 400 });
  }

  const [ipLimit, deviceLimit] = await Promise.all([
    consumeRateLimit(`entitlements:ip:${getClientKey(request)}`, { max: MAX_CHECKS, windowMs: WINDOW_MS }),
    consumeRateLimit(`entitlements:device:${deviceId}`, { max: MAX_CHECKS, windowMs: WINDOW_MS })
  ]);
  if (!ipLimit.allowed || !deviceLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, deviceLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const entitlements = await readDeviceEntitlements(deviceId);
    return NextResponse.json({
      compounds: entitlements.map((item) => ({
        compound_slug: item.slug,
        places: item.places.map(serializePlace)
      }))
    });
  } catch (error) {
    console.error('Entitlement check failed', error);
    return NextResponse.json({ error: 'Could not check access.' }, { status: 500 });
  }
}
