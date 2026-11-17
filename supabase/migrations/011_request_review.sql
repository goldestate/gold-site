-- Needs 009 first (it uses deal_type).
-- New rental/resale requests wait for staff to approve or reject them on the
-- Rental Desk before they are matched. Run in the Supabase SQL editor. Safe to
-- re-run. Until it runs, requests start as 'new' and are matched at once.

alter table public.rental_requests drop constraint if exists rental_requests_status_check;
alter table public.rental_requests
  add constraint rental_requests_status_check
    check (status in ('pending_review', 'new', 'matching', 'matches_sent', 'closed', 'expired'));

alter table public.rental_requests alter column status set default 'pending_review';

-- Same as 009, but a request waiting for review is not matched yet. Approving
-- it on the Rental Desk sets it to 'new' and calls this again.
create or replace function public.generate_matches_for_request(p_request_id uuid)
returns void
language plpgsql
as $$
declare
  v_request public.rental_requests;
  v_inserted integer;
begin
  select * into v_request from public.rental_requests where id = p_request_id;
  if not found or v_request.deal_type <> 'rental' or v_request.status = 'pending_review' then
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

grant execute on function public.generate_matches_for_request(uuid) to service_role;

-- CHECK after running: should return 'pending_review'::text.
-- select column_default from information_schema.columns
-- where table_schema = 'public' and table_name = 'rental_requests' and column_name = 'status';
