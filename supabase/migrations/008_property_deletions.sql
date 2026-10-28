-- A record of every deleted property, so a unit that "disappeared" can be found
-- and put back. Run top to bottom in the Supabase SQL editor. Additive, safe to
-- re-run.
--
-- Until now a delete left nothing behind: no way to tell whether a missing unit
-- was deleted or never saved, and no way back. From here on the database keeps
-- a full copy of each row the moment it is deleted -- whatever deletes it, the
-- admin's Delete button or someone in the Supabase table editor -- and the admin
-- lists them under "Deleted units" with a Restore button. Until this is run, the
-- admin simply doesn't show that section.

create table if not exists public.property_deletions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  name text not null,
  -- The whole row as it was, photos and created_at included, so a restore
  -- brings it back exactly.
  snapshot jsonb not null,
  deleted_at timestamptz not null default now()
);

create index if not exists property_deletions_deleted_at_idx on public.property_deletions (deleted_at desc);

-- Same posture as every other table: the server reads and writes with the
-- service role, and nothing is reachable with the public key.
alter table public.property_deletions enable row level security;

create or replace function public.record_property_deletion()
returns trigger
language plpgsql
as $$
begin
  insert into public.property_deletions (property_id, name, snapshot)
  values (old.id, old.name, to_jsonb(old));
  return old;
end;
$$;

drop trigger if exists properties_record_deletion_trigger on public.properties;
create trigger properties_record_deletion_trigger
  before delete on public.properties
  for each row execute function public.record_property_deletion();

-- Puts a deleted property back under its old id and date, and drops it from the
-- record. Returns the id, or null when there is no such deletion (already
-- restored). Re-inserting goes through the properties triggers like any save,
-- so a rental comes back into the Rental Desk as well.
create or replace function public.restore_deleted_property(p_deletion_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_snapshot jsonb;
  v_id uuid;
begin
  select snapshot into v_snapshot from public.property_deletions where id = p_deletion_id for update;
  if not found then
    return null;
  end if;

  insert into public.properties
  select * from jsonb_populate_record(null::public.properties, v_snapshot)
  returning id into v_id;

  delete from public.property_deletions where id = p_deletion_id;
  return v_id;
end;
$$;

revoke all on function public.restore_deleted_property(uuid) from public, anon, authenticated;
grant execute on function public.restore_deleted_property(uuid) to service_role;

-- CHECK after running: should return one row, with the trigger enabled ('O').
-- select tgname, tgenabled from pg_trigger where tgname = 'properties_record_deletion_trigger';
