/**
 * Admin sessions: a signed expiry time in an httpOnly cookie.
 *
 * Imported by middleware (edge runtime) as well as route handlers, so everything
 * here uses Web Crypto and nothing from node:crypto.
 */
const encoder = new TextEncoder();

export const ADMIN_COOKIE = 'gold_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

// Never used in production. It is in the source, so anything signed with it can
// be forged by anyone who has read this file; it exists only so `next dev` works
// from an empty .env.
const DEV_ONLY_SECRET = 'dev-only-insecure-secret-change-me';

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  arr.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

let cachedKey: { material: string; key: CryptoKey } | null = null;
let warnedNoSecret = false;

/**
 * The key sessions are signed with, or null when there is no safe one.
 *
 * Derived from ADMIN_SESSION_SECRET together with a hash of ADMIN_PASSWORD, so:
 *  - changing the admin password ends every session. A cookie left on a lost or
 *    shared staff phone stops working the moment the password is changed,
 *    instead of lasting out its seven days.
 *  - production never signs with a value that is in the source. If neither
 *    variable is set, there is no key: no session can be created or accepted,
 *    and admin fails closed at the login page. With only the password set, the
 *    key comes from the password alone -- still nothing public, but set
 *    ADMIN_SESSION_SECRET (a long random string) so the key does not rest on
 *    how guessable the password is.
 *
 * Cached per process, keyed on the inputs, so middleware does not re-hash on
 * every request and a changed env var still takes effect.
 */
async function getSessionKey(): Promise<CryptoKey | null> {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.ADMIN_SESSION_SECRET || (isProduction ? '' : DEV_ONLY_SECRET);
  const password = process.env.ADMIN_PASSWORD || '';
  if (!secret && !password) return null;

  // Only reachable in production (dev falls back to DEV_ONLY_SECRET), so it is
  // logged as an error to stand out: with the key resting on the password alone,
  // a stolen session cookie is enough to guess the password offline, unthrottled.
  if (!secret && !warnedNoSecret) {
    warnedNoSecret = true;
    console.error(
      'ADMIN_SESSION_SECRET is not set; admin sessions are signed with a key derived from ADMIN_PASSWORD alone. Set it to a long random string.'
    );
  }

  const material = `${secret}\u0000${password}`;
  if (cachedKey?.material === material) return cachedKey.key;

  const passwordHash = password ? toHex(await sha256(password)) : '';
  const raw = await sha256(`gold-admin-session-v1\u0000${secret}\u0000${passwordHash}`);
  const key = await crypto.subtle.importKey('raw', raw as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify'
  ]);
  cachedKey = { material, key };
  return key;
}

/** A signed session token, or null when the server has no key to sign with (see getSessionKey). */
export async function createSessionToken(): Promise<string | null> {
  const key = await getSessionKey();
  if (!key) return null;
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  const payloadB64 = base64url(encoder.encode(payload));
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  return `${payloadB64}.${base64url(signature)}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return false;

  try {
    const key = await getSessionKey();
    if (!key) return false;
    const signature = base64urlToBytes(sigB64);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature as BufferSource,
      encoder.encode(payloadB64)
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Compares digests rather than the strings themselves: both sides are then the
 * same length, so neither the password's length nor where the first wrong
 * character sits shows up in how long the comparison takes.
 */
export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const [given, wanted] = await Promise.all([sha256(input), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < wanted.length; i += 1) {
    diff |= given[i] ^ wanted[i];
  }
  return diff === 0;
}
