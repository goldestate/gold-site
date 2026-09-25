-- Where each compound is, so the app can tell which one a guest is standing in
-- from the phone's location and show its public places without a code.
-- Run top to bottom in the Supabase SQL editor. Additive, safe to re-run --
-- including after an earlier copy of this file, which had no pin_source.
--
-- Nobody types these in: the site looks each compound up on OpenStreetMap by
-- name and fills the pin itself. Staff only choose radius_km.
--
-- The phone does the matching: it already downloads every compound from
-- /api/compounds, and with these columns that list carries a pin and a radius.
-- The guest's location never reaches GOLD's server, which is the whole reason
-- the check happens on the phone rather than in an endpoint.

alter table public.compounds add column if not exists lat double precision;
alter table public.compounds add column if not exists lng double precision;

-- How far from the pin still counts as this compound, in kilometres. North
-- Coast compounds run for kilometres along the shore, so the default is wide;
-- staff narrow it where two compounds sit side by side.
alter table public.compounds add column if not exists radius_km double precision not null default 3;

-- Who put the pin there. 'auto': the site found the compound on OpenStreetMap
-- by its name, and finds it again if the name changes. 'staff': someone fixed
-- it by hand, and nothing automatic ever moves it. Null with no pin.
alter table public.compounds add column if not exists pin_source text;

-- A pin is both coordinates or neither: half a pin is a typo, not a place.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'compounds_pin_complete') then
    alter table public.compounds add constraint compounds_pin_complete
      check ((lat is null) = (lng is null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'compounds_pin_range') then
    alter table public.compounds add constraint compounds_pin_range
      check (lat is null or (lat between -90 and 90 and lng between -180 and 180));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'compounds_pin_source_values') then
    alter table public.compounds add constraint compounds_pin_source_values
      check (pin_source is null or pin_source in ('auto', 'staff'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'compounds_radius_range') then
    alter table public.compounds add constraint compounds_radius_range
      check (radius_km > 0 and radius_km <= 50);
  end if;
end $$;
