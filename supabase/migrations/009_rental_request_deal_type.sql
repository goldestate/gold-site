-- Rental Desk requests can be for a resale as well as a rental: the broker's
-- client may want to buy a resale unit instead of renting. Run top to bottom in
-- the Supabase SQL editor. Additive, safe to re-run.
--
-- Until this is run the website still takes resale requests, saved with
-- "[Resale]" at the top of their notes; this moves them into the new column.
-- Matching pairs rentals with rental listings, so from here on it leaves
-- resale requests out instead of pairing them with rentals.

alter table public.rental_requests
  add column if not exists deal_type text not null default 'rental'
    check (deal_type in ('rental', 'resale'));

-- Resale requests saved before the column existed.
update public.rental_requests
set deal_type = 'resale',
    notes = nullif(btrim(substr(notes, length('[Resale]') + 1), E' \t\r\n'), '')
where deal_type = 'rental' and notes like '[Resale]%';

create or replace function public.generate_matches_for_request(p_request_id uuid)
returns void
language plpgsql
as $$
declare
  v_request public.rental_requests;
  v_inserted integer;
begin
  select * into v_request from public.rental_requests where id = p_request_id;
  if not found or v_request.deal_type <> 'rental' then
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
      and req.deal_type = 'rental'
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

-- Rentals the old matching paired with resale requests.
delete from public.matches
where request_id in (select id from public.rental_requests where deal_type = 'resale');

update public.rental_requests
set status = 'new'
where deal_type = 'resale' and status = 'matching';

-- CHECK after running: should return one row, 'deal_type'.
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'rental_requests' and column_name = 'deal_type';
