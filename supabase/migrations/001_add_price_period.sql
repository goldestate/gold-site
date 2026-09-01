-- Adds properties.price_period so a listing's price period is stored, not guessed.
-- Run these THREE steps in order in the Supabase SQL editor.

-- STEP 1 -- add the column (nullable for now)
alter table public.properties add column if not exists price_period text;

-- STEP 2 -- backfill: all 32 live listings are per-day rentals (confirmed by Selim)
update public.properties set price_period = 'daily'
  where property_type = 'rental' and price_period is null;
update public.properties set price_period = 'total'
  where property_type <> 'rental' and price_period is null;

-- STEP 2b -- CHECK before continuing. Must return 0.
select count(*) as still_unset from public.properties where price_period is null;

-- STEP 3 -- lock it down (only if step 2b returned 0)
alter table public.properties
  alter column price_period set default 'total',
  alter column price_period set not null,
  add constraint properties_price_period_check
    check (price_period in ('daily', 'monthly', 'quarterly', 'yearly', 'total'));
