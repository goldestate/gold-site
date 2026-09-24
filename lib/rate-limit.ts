type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;
// Past this many keys, expired buckets are dropped before a new one is added. An
// expired bucket and a missing one behave identically, so nothing is lost, and
// expired buckets no longer pile up for as long as the process lives. Live ones
// still count: this bounds the Map by the traffic of one window, not absolutely.
// At most one sweep a minute, so a Map full of live keys is not walked on every
// new caller.
const SWEEP_THRESHOLD = 10_000;
const SWEEP_INTERVAL_MS = 60 * 1000;
let lastSweepAt = 0;

/**
 * In-memory fixed-window limiter. Good enough for throttling the public forms:
 * losing the count on restart costs little there.
 *
 * It is NOT good enough on its own for /api/unlock or admin login, where the
 * counter is what stands between a secret and someone guessing it -- a redeploy
 * would hand an attacker a fresh budget. Those use `consumeRateLimit` in
 * rate-limit-durable.ts, which counts in Postgres. This function stays as its
 * fallback.
 */
export function checkRateLimit(
  key: string,
  options: { max?: number; windowMs?: number } = {}
): { allowed: boolean; retryAfterSeconds: number } {
  const max = options.max ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    if (!bucket && buckets.size >= SWEEP_THRESHOLD && now - lastSweepAt >= SWEEP_INTERVAL_MS) {
      lastSweepAt = now;
      sweepExpired(now);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Gives back one attempt that `checkRateLimit` allowed -- used when the attempt turned out legitimate. */
export function refundRateLimit(key: string) {
  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt >= Date.now() && bucket.count > 0) bucket.count -= 1;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

function sweepExpired(now: number) {
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt < now) buckets.delete(key);
  });
}

/**
 * The caller's address, as a rate-limit key.
 *
 * Takes the RIGHTMOST X-Forwarded-For entry. Railway's edge appends the address
 * it accepted the connection from to the end of the header and passes along
 * whatever the client had already written in front of it. The leftmost entry is
 * therefore the caller's own choice: keying on it (as this used to) let anyone
 * send `X-Forwarded-For: <random>` and get a fresh bucket on every request,
 * which removed the unlock and admin-login limits entirely. The rightmost entry
 * is the only one written by infrastructure we trust.
 *
 * Walking in from the right, private, carrier-NAT and loopback hops are skipped.
 * No guest reaches the edge from one of those, so such an entry can only be a
 * proxy inside Railway's network; were one ever added behind the edge, keying on
 * it would put every guest in one bucket, and ten wrong guesses from anyone would
 * lock every guest out. Nothing to the left of the first public entry is read,
 * so skipping gives a caller no way to pick their own key.
 *
 * That holds while Railway's edge is the only proxy that faces the internet
 * (gold-eg.com answers directly from `server: railway-hikari`). If a CDN such as
 * Cloudflare is ever put in front, the rightmost public entry becomes the CDN's
 * address and every guest would share its buckets -- this must change then.
 *
 * X-Real-IP is the fallback: Railway sets it to the connecting address too.
 * 'unknown' only happens off Railway (local dev), where one shared bucket is fine.
 */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const hops = forwardedFor
      .split(',')
      .map(normaliseAddress)
      .filter(Boolean);
    for (let i = hops.length - 1; i >= 0; i -= 1) {
      if (!isInternalAddress(hops[i])) return addressKey(hops[i]);
    }
    // Every hop internal: local dev behind a container proxy. The nearest will do.
    if (hops.length > 0) return addressKey(hops[hops.length - 1]);
  }
  const realIp = normaliseAddress(request.headers.get('x-real-ip') ?? '');
  if (realIp) return addressKey(realIp);
  return 'unknown';
}

/** Strips what is not the address itself: brackets, a port, IPv4-mapped IPv6. */
function normaliseAddress(raw: string): string {
  let value = raw.trim().toLowerCase();
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(value);
  if (bracketed) value = bracketed[1];
  const v4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(value);
  if (v4WithPort) value = v4WithPort[1];
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
  if (mapped) value = mapped[1];
  return value;
}

function ipv4Octets(address: string): number[] | null {
  const parts = address.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map(Number);
  return octets.every((n, i) => /^\d{1,3}$/.test(parts[i]) && n <= 255) ? octets : null;
}

/** The eight 16-bit groups of an IPv6 address, or null if it is not one. */
function ipv6Groups(address: string): number[] | null {
  let bare = address.split('%')[0];
  if (!bare.includes(':')) return null;
  // A trailing dotted IPv4 (64:ff9b::1.2.3.4 and the like) stands for two groups.
  const v4Tail = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(bare);
  if (v4Tail) {
    const o = ipv4Octets(v4Tail[2]);
    if (!o) return null;
    bare = `${v4Tail[1]}${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const halves = bare.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const groups = [...head, ...tail];
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null;
  const missing = 8 - groups.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const numbers = groups.map((group) => parseInt(group, 16));
  if (halves.length === 1) return numbers;
  return [...numbers.slice(0, head.length), ...new Array<number>(missing).fill(0), ...numbers.slice(head.length)];
}

function isInternalAddress(address: string): boolean {
  const v4 = ipv4Octets(address);
  if (v4) {
    const [a, b] = v4;
    return (
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT, 100.64/10
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const v6 = ipv6Groups(address);
  if (v6) {
    return (
      v6.every((group, i) => group === (i === 7 ? 1 : 0)) || // ::1
      (v6[0] & 0xfe00) === 0xfc00 || // unique local, fc00::/7
      (v6[0] & 0xffc0) === 0xfe80 // link local, fe80::/10
    );
  }
  return false;
}

/**
 * IPv6 callers are keyed by their /64. One household or phone is normally given
 * a whole /64, so keying on the full address would let anyone holding one pick a
 * fresh bucket per request. gold-eg.com has no AAAA record today; this is for the
 * day it does.
 */
function addressKey(address: string): string {
  const v6 = ipv6Groups(address);
  if (!v6) return address;
  return `${v6
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(':')}::/64`;
}
