import { supabase } from './supabase';
import { checkRateLimit, refundRateLimit, resetRateLimit } from './rate-limit';

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  /**
   * Gives this attempt back. For callers that only want to count attempts that
   * turn out bad -- /api/unlock refunds a correct code so a compound's shared
   * Wi-Fi doesn't run out of tries on a busy check-in day. Never throws: a refund
   * that fails leaves the attempt counted, which is how every attempt used to be.
   */
  refund: () => Promise<void>;
  /** Clears the key's window entirely, e.g. after a correct admin password. Never throws. */
  reset: () => Promise<void>;
};

/**
 * Rate limiting that survives a restart and is shared across instances.
 *
 * Kept in its own module rather than added to `rate-limit.ts` so that the
 * in-memory limiter stays free of any dependency on Supabase env vars. Admin
 * login imports this lazily for the same reason: admin login is the recovery
 * path, and it should not become unreachable because a database credential is
 * missing.
 *
 * Falls back to the in-memory counter when the database call fails. That is
 * deliberate: a Supabase outage should not lock every guest out of a code they
 * were legitimately given, and the fallback still bounds attempts -- just per
 * process rather than globally. The failure is logged, so a limiter quietly
 * running degraded is visible rather than silent. `refund` and `reset` go to
 * whichever counter the attempt was actually taken from.
 *
 * Requires migration 003_rate_limit_buckets.sql. Until that runs, every call
 * takes the fallback path. Migration 005 makes refusals stop writing and adds
 * `refund_rate_limit`; without it, refunds use a compare-and-set on the table
 * instead, so behaviour is the same either way.
 */
export async function consumeRateLimit(
  key: string,
  options: { max: number; windowMs: number }
): Promise<RateLimitResult> {
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

    return {
      allowed: data.allowed,
      retryAfterSeconds: data.retry_after_seconds,
      refund: () => refundDurable(key),
      reset: () => resetDurable(key)
    };
  } catch (error) {
    console.error('Durable rate limit unavailable, falling back to in-memory', error);
    const result = checkRateLimit(key, options);
    return {
      ...result,
      refund: async () => refundRateLimit(key),
      reset: async () => resetRateLimit(key)
    };
  }
}

async function refundDurable(key: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('refund_rate_limit', { p_key: key });
    if (!error) return;

    // Migration 005 not run yet. PostgREST cannot express `count = count - 1`,
    // so decrement only if the count is still what was read; a concurrent
    // attempt that moved it in between makes the update match nothing, and the
    // read is simply repeated.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error: readError } = await supabase
        .from('rate_limit_buckets')
        .select('count')
        .eq('key', key)
        .maybeSingle<{ count: number }>();
      if (readError) throw readError;
      if (!data || data.count <= 0) return;

      const { data: updated, error: writeError } = await supabase
        .from('rate_limit_buckets')
        .update({ count: data.count - 1 })
        .eq('key', key)
        .eq('count', data.count)
        .select('key');
      if (writeError) throw writeError;
      if (updated && updated.length > 0) return;
    }
  } catch (error) {
    console.error('Could not refund rate limit attempt', error);
  }
}

async function resetDurable(key: string): Promise<void> {
  try {
    const { error } = await supabase.from('rate_limit_buckets').delete().eq('key', key);
    if (error) throw error;
  } catch (error) {
    console.error('Could not reset rate limit', error);
  }
}
