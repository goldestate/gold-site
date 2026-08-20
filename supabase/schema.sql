-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> Run).
-- Creates the properties table and the storage bucket used for listing photos.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  property_type text not null,
  unit_type text not null,
  price numeric not null default 0,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area numeric not null default 0,
  description text not null default '',
  images jsonb not null default '[]'::jsonb,
  tone text not null default 'color',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists properties_published_idx on public.properties (published);
create index if not exists properties_created_at_idx on public.properties (created_at desc);

-- The app talks to this table exclusively through the server-side service role key,
-- which bypasses row level security entirely, so RLS stays enabled with no public
-- policies -- the table is not reachable from a browser using the publishable/anon key.
alter table public.properties enable row level security;

-- Public bucket: object bytes are served straight from the public URL without
-- going through row level security, so no storage.objects policies are needed
-- for reads. Writes still require the service role key, used only server-side.
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- Rental Desk (Phase 1): brokers submit rental requirements,
-- owners list rentals, matches links the two together.
-- ============================================================

create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  whatsapp text,
  email text,
  status text not null default 'guest'
    check (status in ('guest', 'registered', 'verified')),
  created_at timestamptz not null default now()
);

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  created_at timestamptz not null default now()
);

-- Backs rental_requests.reference_code (format RR-#####).
create sequence if not exists public.rental_request_reference_seq;

create table if not exists public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers (id),
  property_type text not null
    check (property_type in ('apartment', 'villa', 'office', 'retail', 'chalet', 'other')),
  location text not null,
  budget_min numeric,
  budget_max numeric,
  bedrooms integer,
  furnished boolean,
  move_in_date date,
  rental_period text
    check (rental_period in ('monthly', 'yearly', 'short_term')),
  notes text,
  status text not null default 'new'
    check (status in ('new', 'matching', 'matches_sent', 'closed', 'expired')),
  reference_code text not null unique
    default ('RR-' || lpad(nextval('public.rental_request_reference_seq')::text, 5, '0')),
  created_at timestamptz not null default now()
);

create table if not exists public.rental_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id),
  property_type text not null
    check (property_type in ('apartment', 'villa', 'office', 'retail', 'chalet', 'other')),
  location text not null,
  price numeric not null default 0,
  bedrooms integer,
  furnished boolean,
  available_from date,
  -- Same pattern as properties.images: URLs of files uploaded to the
  -- rental-photos storage bucket below, stored as a JSON array.
  photos jsonb not null default '[]'::jsonb,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'active', 'rented', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rental_requests (id),
  listing_id uuid not null references public.rental_listings (id),
  match_score integer not null check (match_score between 0 and 100),
  sent_to_broker boolean not null default false,
  sent_at timestamptz,
  broker_response text
    check (broker_response in ('interested', 'not_interested', 'no_response')),
  created_at timestamptz not null default now()
);

-- Foreign key indexes
create index if not exists rental_requests_broker_id_idx on public.rental_requests (broker_id);
create index if not exists rental_listings_owner_id_idx on public.rental_listings (owner_id);
create index if not exists matches_request_id_idx on public.matches (request_id);
create index if not exists matches_listing_id_idx on public.matches (listing_id);

-- Matching-field indexes
create index if not exists rental_requests_property_type_idx on public.rental_requests (property_type);
create index if not exists rental_requests_location_idx on public.rental_requests (location);
create index if not exists rental_requests_status_idx on public.rental_requests (status);

create index if not exists rental_listings_property_type_idx on public.rental_listings (property_type);
create index if not exists rental_listings_location_idx on public.rental_listings (location);
create index if not exists rental_listings_status_idx on public.rental_listings (status);

-- Row level security: as with properties, the app's primary access path is
-- the server-side service role key, which bypasses RLS entirely. There is
-- no Supabase Auth identity in play here, so there's no way to scope reads
-- to "your own" rows -- rental_requests and rental_listings accept direct
-- anonymous inserts (for public "submit a requirement" / "list a rental"
-- forms) but no table grants anonymous SELECT, so nobody can read anyone
-- else's submissions, including their own, over the anon key.
alter table public.brokers enable row level security;
alter table public.owners enable row level security;
alter table public.rental_requests enable row level security;
alter table public.rental_listings enable row level security;
alter table public.matches enable row level security;

drop policy if exists "Anon can submit rental requests" on public.rental_requests;
create policy "Anon can submit rental requests"
  on public.rental_requests
  for insert
  to anon
  with check (true);

drop policy if exists "Anon can submit rental listings" on public.rental_listings;
create policy "Anon can submit rental listings"
  on public.rental_listings
  for insert
  to anon
  with check (true);

-- Same public-bucket pattern as property-photos: object bytes are served
-- straight from the public URL, so no storage.objects policies are needed
-- for reads. Writes still require the service role key, used only server-side.
insert into storage.buckets (id, name, public)
values ('rental-photos', 'rental-photos', true)
on conflict (id) do nothing;

-- Rental Desk (Phase 2): the public forms upsert a broker/owner by phone
-- number on every submission, so phone must be required and unique.
alter table public.brokers alter column phone set not null;
create unique index if not exists brokers_phone_key on public.brokers (phone);

alter table public.owners alter column phone set not null;
create unique index if not exists owners_phone_key on public.owners (phone);

-- ============================================================
-- Rental Desk (Phase 3): automatic matching engine
-- ============================================================
-- property_type is a hard filter, not a weighted dimension: a request for
-- an apartment is never matched against a villa listing, no matter how
-- well everything else lines up. Every other dimension below is weighted
-- and still contributes even when it's a poor fit, so a listing that's
-- strong everywhere else can still clear the insert threshold despite one
-- weak spot (e.g. a slightly-off location on an otherwise perfect match).
--
-- Weights (sum to 1.0): budget fit 30%, location 25%, bedrooms 20%,
-- furnished 15%, availability 10%.

-- A unique pair prevents duplicate rows if a listing cycles through
-- active/inactive/active (each activation re-runs the matching pass).
create unique index if not exists matches_request_listing_key on public.matches (request_id, listing_id);

create or replace function public.rental_match_score(
  p_request public.rental_requests,
  p_listing public.rental_listings
) returns integer
language plpgsql
as $$
declare
  budget_score numeric := 1;
  location_score numeric;
  bedrooms_score numeric := 1;
  furnished_score numeric := 1;
  availability_score numeric := 1;
  lo numeric;
  hi numeric;
begin
  -- Budget fit: full credit inside [budget_min, budget_max] (an unset bound
  -- is treated as unbounded on that side); linear decay to 0 once the price
  -- is 100% outside the nearest bound. Guard both bounds against being
  -- exactly 0 to avoid a division by zero on that edge case.
  if p_request.budget_min is not null or p_request.budget_max is not null then
    lo := coalesce(p_request.budget_min, 0);
    hi := p_request.budget_max;
    if hi is not null and p_listing.price > hi then
      budget_score := case when hi = 0 then 0 else greatest(0, 1 - (p_listing.price - hi) / hi) end;
    elsif p_listing.price < lo then
      budget_score := case when lo = 0 then 0 else greatest(0, 1 - (lo - p_listing.price) / lo) end;
    else
      budget_score := 1;
    end if;
  end if;

  -- Location: this taxonomy is five broad regions with no notion of
  -- "nearby," so it's a plain binary match.
  location_score := case when p_request.location = p_listing.location then 1 else 0 end;

  -- Bedrooms: the request asks for a minimum; a bigger listing is a full
  -- match, a smaller one loses credit in proportion to the shortfall.
  if p_request.bedrooms is not null and p_request.bedrooms > 0 then
    bedrooms_score := least(1, coalesce(p_listing.bedrooms, 0)::numeric / p_request.bedrooms);
  end if;

  -- Furnished: no stated preference, or an owner who hasn't specified,
  -- shouldn't be penalized like a genuine mismatch would be.
  if p_request.furnished is not null then
    if p_listing.furnished is null then
      furnished_score := 0.5;
    else
      furnished_score := case when p_request.furnished = p_listing.furnished then 1 else 0 end;
    end if;
  end if;

  -- Availability: the listing must be ready by the requested move-in date;
  -- lateness decays to 0 over a month, unspecified dates get full credit.
  if p_request.move_in_date is not null and p_listing.available_from is not null then
    if p_listing.available_from <= p_request.move_in_date then
      availability_score := 1;
    else
      availability_score := greatest(0, 1 - (p_listing.available_from - p_request.move_in_date) / 30.0);
    end if;
  end if;

  return round(
    100 * (
      0.30 * budget_score +
      0.25 * location_score +
      0.20 * bedrooms_score +
      0.15 * furnished_score +
      0.10 * availability_score
    )
  )::integer;
end;
$$;

-- Scores p_request against every active listing of the same property_type
-- and inserts the matches that clear 50, best first. Bumps the request out
-- of 'new' once it has at least one candidate; never touches a request
-- that has already moved past 'new' (matching/matches_sent/closed/expired).
create or replace function public.generate_matches_for_request(p_request_id uuid)
returns void
language plpgsql
as $$
declare
  v_request public.rental_requests;
  v_inserted integer;
begin
  select * into v_request from public.rental_requests where id = p_request_id;
  if not found then
    return;
  end if;

  with scored as (
    select listing.id as listing_id, public.rental_match_score(v_request, listing) as score
    from public.rental_listings listing
    where listing.status = 'active'
      and listing.property_type = v_request.property_type
  )
  insert into public.matches (request_id, listing_id, match_score)
  select v_request.id, listing_id, score
  from scored
  where score > 50
  order by score desc
  on conflict (request_id, listing_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 and v_request.status = 'new' then
    update public.rental_requests set status = 'matching' where id = v_request.id;
  end if;
end;
$$;

-- Scores p_listing against every open request (status 'new' or 'matching')
-- of the same property_type and inserts the matches that clear 50, best
-- first. Bumps any newly-matched request out of 'new' the same way.
create or replace function public.generate_matches_for_listing(p_listing_id uuid)
returns void
language plpgsql
as $$
declare
  v_listing public.rental_listings;
begin
  select * into v_listing from public.rental_listings where id = p_listing_id;
  if not found or v_listing.status <> 'active' then
    return;
  end if;

  with scored as (
    select req.id as request_id, public.rental_match_score(req, v_listing) as score
    from public.rental_requests req
    where req.status in ('new', 'matching')
      and req.property_type = v_listing.property_type
  ),
  inserted as (
    insert into public.matches (request_id, listing_id, match_score)
    select request_id, v_listing.id, score
    from scored
    where score > 50
    order by score desc
    on conflict (request_id, listing_id) do nothing
    returning request_id
  )
  update public.rental_requests
  set status = 'matching'
  where id in (select request_id from inserted)
    and status = 'new';
end;
$$;

create or replace function public.trg_rental_request_match()
returns trigger
language plpgsql
as $$
begin
  perform public.generate_matches_for_request(new.id);
  return new;
end;
$$;

drop trigger if exists rental_requests_match_trigger on public.rental_requests;
create trigger rental_requests_match_trigger
  after insert on public.rental_requests
  for each row execute function public.trg_rental_request_match();

create or replace function public.trg_rental_listing_match()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' then
    perform public.generate_matches_for_listing(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists rental_listings_match_trigger on public.rental_listings;
create trigger rental_listings_match_trigger
  after update of status on public.rental_listings
  for each row execute function public.trg_rental_listing_match();

-- ============================================================
-- Rental Desk: fold GOLD's own rental inventory into the matching pool
-- ============================================================
-- Every `properties` row with property_type = 'rental' -- published or
-- not, since public-site visibility and rental-desk matching eligibility
-- are separate concerns -- is mirrored into rental_listings under a
-- synthetic "GOLD" owner, so the existing matching engine and admin UI
-- need zero special-casing to also consider in-house inventory.

-- ON DELETE SET NULL is a defensive backup only; the BEFORE DELETE trigger
-- below does this proactively so the DELETE never needs to fall back on it.
alter table public.rental_listings
  add column if not exists source_property_id uuid references public.properties (id) on delete set null;

create unique index if not exists rental_listings_source_property_id_key
  on public.rental_listings (source_property_id)
  where source_property_id is not null;

-- properties.unit_type is a finer-grained taxonomy than rental_listings'
-- property_type; this collapses it onto the closest equivalent.
create or replace function public.map_unit_type_to_rental_property_type(p_unit_type text)
returns text
language sql
immutable
as $$
  select case p_unit_type
    when 'apartment' then 'apartment'
    when 'penthouse' then 'apartment'
    when 'studio' then 'apartment'
    when 'villa' then 'villa'
    when 'townhouse' then 'villa'
    when 'twinhouse' then 'villa'
    when 'chalet' then 'chalet'
    when 'cabin' then 'chalet'
    when 'office' then 'office'
    when 'clinic' then 'office'
    else 'other'
  end;
$$;

create or replace function public.get_or_create_gold_owner_id()
returns uuid
language plpgsql
as $$
declare
  v_owner_id uuid;
begin
  -- Insert-first with a conflict fallback (rather than select-then-insert)
  -- so two properties saved back-to-back can't both miss the row and race
  -- to insert it, which owners.phone's unique index would otherwise reject.
  insert into public.owners (name, phone)
  values ('GOLD Investment Opportunities (In-house)', '+20 106 637 7883')
  on conflict (phone) do nothing
  returning id into v_owner_id;

  if v_owner_id is null then
    select id into v_owner_id from public.owners where phone = '+20 106 637 7883';
  end if;

  return v_owner_id;
end;
$$;

-- Keeps one rental_listings row per rental-type property in sync with its
-- source. Ordinary edits (price, bedrooms, location, unit type, photos)
-- refresh the mirror without touching its status, so an admin's manual
-- "rented" / "inactive" choice on the mirror survives unrelated edits to
-- the source property. Only a genuine property_type transition (into or
-- out of 'rental') changes the mirror's status here -- transitioning out
-- sets it 'inactive' rather than deleting the row, so match history isn't
-- destroyed by a re-categorization.
--
-- This only runs AFTER insert/update, not delete: on delete, the mirror
-- still needs to exist (and its source_property_id still needs to point
-- at the row about to disappear) for a BEFORE trigger to react to it --
-- seeing this run AFTER the row is gone would be too late. See the
-- separate BEFORE DELETE trigger below.
--
-- properties.price for rental-type units is quoted per day (see
-- lib/property-taxonomy.ts priceSuffixLabel); rental_listings.price is
-- monthly, so this multiplies by 30 as an approximate, explicitly-flagged
-- conversion -- good enough for matching, not meant to be exact.
create or replace function public.sync_rental_listing_from_property()
returns trigger
language plpgsql
as $$
declare
  v_mirror_id uuid;
  v_was_rental boolean;
  v_now_rental boolean;
begin
  v_now_rental := (new.property_type = 'rental');
  v_was_rental := (tg_op = 'UPDATE' and old.property_type = 'rental');

  if not v_now_rental then
    if v_was_rental then
      update public.rental_listings set status = 'inactive' where source_property_id = new.id;
    end if;
    return new;
  end if;

  select id into v_mirror_id from public.rental_listings where source_property_id = new.id;

  if v_mirror_id is null then
    insert into public.rental_listings (
      owner_id, property_type, location, price, bedrooms, furnished, available_from, photos, status, source_property_id
    ) values (
      public.get_or_create_gold_owner_id(),
      public.map_unit_type_to_rental_property_type(new.unit_type),
      new.location,
      new.price * 30,
      new.bedrooms,
      null,
      null,
      new.images,
      'active',
      new.id
    )
    returning id into v_mirror_id;
  else
    update public.rental_listings
    set
      property_type = public.map_unit_type_to_rental_property_type(new.unit_type),
      location = new.location,
      price = new.price * 30,
      bedrooms = new.bedrooms,
      photos = new.images,
      status = case when not v_was_rental then 'active' else status end
    where id = v_mirror_id;
  end if;

  perform public.generate_matches_for_listing(v_mirror_id);
  return new;
end;
$$;

drop trigger if exists properties_sync_rental_listing_trigger on public.properties;
create trigger properties_sync_rental_listing_trigger
  after insert or update on public.properties
  for each row execute function public.sync_rental_listing_from_property();

-- BEFORE, not AFTER: this has to run -- and finish clearing
-- source_property_id -- before Postgres's own FK enforcement checks
-- whether the row being deleted is still referenced, and before the row
-- is actually gone. An AFTER trigger here would race that check (and,
-- depending on trigger firing order, could lose it silently).
create or replace function public.deactivate_rental_listing_before_property_delete()
returns trigger
language plpgsql
as $$
begin
  update public.rental_listings
  set status = 'inactive', source_property_id = null
  where source_property_id = old.id;
  return old;
end;
$$;

drop trigger if exists properties_deactivate_rental_listing_trigger on public.properties;
create trigger properties_deactivate_rental_listing_trigger
  before delete on public.properties
  for each row execute function public.deactivate_rental_listing_before_property_delete();

-- Backfill: mirror any rental-type properties that already existed
-- before this trigger was created.
insert into public.rental_listings (
  owner_id, property_type, location, price, bedrooms, furnished, available_from, photos, status, source_property_id
)
select
  public.get_or_create_gold_owner_id(),
  public.map_unit_type_to_rental_property_type(p.unit_type),
  p.location,
  p.price * 30,
  p.bedrooms,
  null,
  null,
  p.images,
  'active',
  p.id
from public.properties p
where p.property_type = 'rental'
on conflict (source_property_id) where source_property_id is not null do update set
  property_type = excluded.property_type,
  location = excluded.location,
  price = excluded.price,
  bedrooms = excluded.bedrooms,
  photos = excluded.photos;

-- The backfill above is a bulk insert, so it doesn't go through the
-- properties trigger and never calls generate_matches_for_listing.
-- Run it explicitly for every mirror so this backfill also catches any
-- requests that were already open before it ran.
do $$
declare
  r record;
begin
  for r in select id from public.rental_listings where source_property_id is not null loop
    perform public.generate_matches_for_listing(r.id);
  end loop;
end;
$$;
