-- Signed confidentiality agreements (GOLD's NDA & Brokerage Cooperation Agreement).
-- Run top to bottom in the Supabase SQL editor. Additive, safe to re-run.
--
-- Every "Request a unit" and "List your property" submission gets one row here,
-- 'pending', with a random token. The token is the signer's link to the signing
-- page; signing fills in how they signed and where the file is, and turns the
-- row 'signed'. Until this is run, the site skips the signing step and the forms
-- work exactly as before.

create table if not exists public.nda_agreements (
  id uuid primary key default gen_random_uuid(),
  -- The submission it belongs to: exactly one of these is set.
  rental_request_id uuid references public.rental_requests (id) on delete cascade,
  rental_listing_id uuid references public.rental_listings (id) on delete cascade,
  -- The signing link's secret. Random, unguessable, and useless once signed.
  token text not null unique,
  status text not null default 'pending',
  -- lib/nda.ts NDA_VERSION at the time of signing: the exact wording agreed to.
  agreement_version text not null,
  signer_name text not null,
  signer_company text not null default '',
  signer_phone text not null default '',
  signer_email text not null default '',
  -- 'drawn': signed on screen. 'uploaded': a photo or PDF of a signed copy.
  method text,
  -- Path inside the private nda-files bucket.
  file_path text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint nda_agreements_one_subject check ((rental_request_id is null) <> (rental_listing_id is null)),
  constraint nda_agreements_status_values check (status in ('pending', 'signed')),
  constraint nda_agreements_method_values check (method is null or method in ('drawn', 'uploaded')),
  constraint nda_agreements_signed_complete check (
    status = 'pending' or (method is not null and file_path is not null and signed_at is not null)
  )
);

create index if not exists nda_agreements_request_idx on public.nda_agreements (rental_request_id);
create index if not exists nda_agreements_listing_idx on public.nda_agreements (rental_listing_id);

-- Same posture as every other table: the server reads and writes with the
-- service role, and nothing is reachable with the public key.
alter table public.nda_agreements enable row level security;

-- Private: signatures and signed documents are never public. The admin opens
-- them through short-lived signed links.
insert into storage.buckets (id, name, public)
values ('nda-files', 'nda-files', false)
on conflict (id) do update set public = false;
