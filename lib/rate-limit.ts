type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * In-memory sliding-window limiter. Good enough for a single long-running
 * Node process (this app's Railway deployment); it resets on restart and
 * doesn't share state across instances, which is an acceptable trade-off
 * for throttling login guesses without adding an external dependency.
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
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}
