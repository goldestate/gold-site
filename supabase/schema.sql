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
