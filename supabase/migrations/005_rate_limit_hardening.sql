-- Rate limit hardening for /api/unlock, /api/entitlements and admin login.
-- Run top to bottom in the Supabase SQL editor. Safe to re-run, and safe to run
-- whether or not 003 was (it creates what 003 would have).
--
-- The site works without this migration -- every change here has a fallback in
-- lib/rate-limit-durable.ts. What running it adds:
--   1. Nothing but the server can call the rate limit functions. 003 revoked
--      them from public and anon but not from `authenticated`, and Supabase
--      grants that role EXECUTE on new functions by default. Anyone who signed
--      up through Supabase Auth (on by default) could call consume_rate_limit
--      with any key and window and lock a guest's IP out for as long as they
--      liked.
--   2. A refused request no longer writes. 003 incremented the count on every
--      call, refused or not, so a flood of refused requests was a flood of row
--      updates and a count climbing without limit.
--   3. refund_rate_limit, so /api/unlock can give a correct code its attempt
--      back in one statement (without it the site does a compare-and-set).
--   4. Expired windows go at the next sweep after they expire (one in ~100
--      allowed calls runs it) rather than waiting a further day as in 003. An
--      expired row behaves exactly like a missing one, so nothing is lost.

-- ============================================================
-- buckets (as in 003)
-- ============================================================
create table if not exists public.rate_limit_buckets (
  -- Namespaced by caller, e.g. 'unlock:ip:1.2.3.4' or 'unlock:device:<uuid>'.
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);
create index if not exists rate_limit_buckets_reset_idx on public.rate_limit_buckets (reset_at);
alter table public.rate_limit_buckets enable row level security;

-- RLS with no policies already hides the table from anon and authenticated.
-- Revoking the grants too means a policy added by mistake later still exposes nothing.
revoke all on table public.rate_limit_buckets from anon, authenticated;

-- ============================================================
-- consume_rate_limit (same signature and result as 003)
-- ============================================================
create or replace function public.consume_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket public.rate_limit_buckets%rowtype;
begin
  -- One statement still does the read, the window roll and the increment, so
  -- two requests arriving together cannot both read the same count.
  --
  -- The WHERE on the update is the change from 003: a key already past its
  -- limit inside a live window is left alone. Its count stops at p_max + 1
  -- (enough to say "refused") and a refused request costs a read, not a write.
  insert into public.rate_limit_buckets as b (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set
      -- An expired window starts over at 1 rather than continuing to climb.
      count = case when b.reset_at <= now() then 1 else b.count + 1 end,
      reset_at = case
        when b.reset_at <= now() then now() + make_interval(secs => p_window_seconds)
        else b.reset_at
      end
    where b.reset_at <= now() or b.count <= p_max
  returning * into bucket;

  if not found then
    -- Nothing was written because the key is already over its limit.
    select * into bucket from public.rate_limit_buckets where key = p_key;
    return query
      select false, greatest(1, ceil(extract(epoch from (coalesce(bucket.reset_at, now()) - now()))))::integer;
    return;
  end if;

  -- Rows are keyed by IP and device id, so the table would otherwise grow one
  -- row per caller forever. Sweeping on ~1% of calls keeps it bounded without a
  -- scheduled job. Any expired row can go: the next call for its key starts a
  -- fresh window at 1 either way.
  if random() < 0.01 then
    delete from public.rate_limit_buckets where reset_at < now();
  end if;

  if bucket.count > p_max then
    return query
      select false, greatest(1, ceil(extract(epoch from (bucket.reset_at - now()))))::integer;
  else
    return query select true, 0;
  end if;
end;
$$;

-- ============================================================
-- refund_rate_limit
-- ============================================================
-- Gives back one attempt that consume_rate_limit allowed. /api/unlock calls it
-- when the code was right, so only wrong codes spend the per-IP budget that a
-- whole compound's Wi-Fi shares. Never goes below 0, and does nothing to an
-- expired window (the next call starts fresh anyway).
create or replace function public.refund_rate_limit(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.rate_limit_buckets
  set count = count - 1
  where key = p_key and count > 0 and reset_at > now();
$$;

-- ============================================================
-- Who may call them: the server's service role, nobody else
-- ============================================================
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

revoke all on function public.refund_rate_limit(text) from public, anon, authenticated;
grant execute on function public.refund_rate_limit(text) to service_role;

-- CHECK after running. Every row must say false except service_role.
-- select r.role,
--        has_function_privilege(r.role, 'public.consume_rate_limit(text,integer,integer)', 'execute') as consume,
--        has_function_privilege(r.role, 'public.refund_rate_limit(text)', 'execute') as refund
-- from (values ('anon'), ('authenticated'), ('service_role')) as r(role);
