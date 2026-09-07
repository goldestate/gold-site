-- Per-stay codes: many live codes per compound, each with an owner and an end date.
-- Run top to bottom in the Supabase SQL editor. Additive, safe to re-run.
--
-- Until now a compound had exactly one active code: issuing a new one deactivated
-- the old one, and `readActiveCode` assumed a single row. That cannot express what
-- a rental business actually does -- guest A checks out Tuesday, guest B on Friday,
-- and both need a code that stops working when their stay ends.

-- Who the code was issued to. Free text on purpose: staff write "Ahmed, unit 12"
-- or "Owners", and nothing downstream parses it.
alter table public.compound_codes add column if not exists label text not null default '';

-- Null means no expiry -- an owners' or staff code that stays live until revoked.
-- A timestamp means the code stops being redeemable at that moment, and devices
-- that already redeemed it lose access the next time they can reach the server.
alter table public.compound_codes add column if not exists expires_at timestamptz;

-- Listing a compound's live codes is now the common read, so index for it. The
-- existing partial index on (code) where active still serves redemption.
create index if not exists compound_codes_compound_active_idx
  on public.compound_codes (compound_id, active);

-- Entitlement checks join redemptions to codes by device. This is the hot path on
-- every app launch, so it gets its own index.
create index if not exists redemptions_device_idx on public.redemptions (device_id);
