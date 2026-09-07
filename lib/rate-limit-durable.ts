import { supabase } from './supabase';
import { checkRateLimit } from './rate-limit';

/**
 * Rate limiting that survives a restart and is shared across instances.
 *
 * Kept in its own module rather than added to `rate-limit.ts` so that the
 * in-memory limiter stays free of any dependency on Supabase env vars. Admin
 * login uses that one, and admin login is the recovery path -- it should not
 * become unreachable because a database credential is missing.
 *
 * Falls back to the in-memory counter when the database call fails. That is
 * deliberate: a Supabase outage should not lock every guest out of a code they
 * were legitimately given, and the fallback still bounds attempts -- just per
 * process rather than globally. The failure is logged, so a limiter quietly
 * running degraded is visible rather than silent.
 *
 * Requires migration 003_rate_limit_buckets.sql. Until that runs, every call
 * takes the fallback path and behaviour is exactly what it was before.
 */
export async function consumeRateLimit(
  key: string,
  options: { max: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const { data, error } = await supabase
      .rpc('consume_rate_limit', {
        p_key: key,
        p_max: options.max,
        p_window_seconds: Math.ceil(options.windowMs / 1000)
      })
      .single<{ allowed: boolean; retry_after_seconds: number }>();

    if (error) throw error;
    if (!data) throw new Error('consume_rate_limit returned no row');

    return { allowed: data.allowed, retryAfterSeconds: data.retry_after_seconds };
  } catch (error) {
    console.error('Durable rate limit unavailable, falling back to in-memory', error);
    return checkRateLimit(key, options);
  }
}
