-- Durable rate limiting for the unlock endpoint.
-- Run top to bottom in the Supabase SQL editor. Safe to re-run.
--
-- Why this exists: lib/rate-limit.ts counts attempts in a per-process Map. That
-- is fine for the admin login it was written for, but /api/unlock is the only
-- thing standing between the code space and someone enumerating it, and an
-- in-process counter resets on every deploy and every container restart, and is
-- not shared if the service ever runs more than one instance. Counting in the
-- database survives all three.

-- ============================================================
-- buckets
-- ============================================================
create table if not exists public.rate_limit_buckets (
  -- Namespaced by caller, e.g. 'unlock:ip:1.2.3.4' or 'unlock:device:<uuid>'.
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);
create index if not exists rate_limit_buckets_reset_idx on public.rate_limit_buckets (reset_at);

-- ============================================================
-- consume_rate_limit
-- ============================================================
-- One statement does the read, the window roll, and the increment, so two
-- requests arriving together cannot both read the same count and both be let
-- through. Doing this in application code would need a transaction per attempt;
-- the upsert gets it for free.
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
  returning * into bucket;

  -- Rows are keyed by IP and device id, so the table would otherwise grow one
  -- row per caller forever. Sweeping on ~1% of calls keeps it bounded without a
  -- scheduled job, and costs nothing on the other 99%.
  if random() < 0.01 then
    delete from public.rate_limit_buckets where reset_at < now() - interval '1 day';
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
-- Row level security
-- ============================================================
-- Same posture as the rest of the schema: server-side service role only, no
-- public policies, nothing reachable with the anon key.
alter table public.rate_limit_buckets enable row level security;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, integer, integer) from anon;

  
