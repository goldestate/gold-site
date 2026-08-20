import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
}

/**
 * Server-only client. The service role key bypasses row level security, so this must never reach the browser.
 *
 * This is a singleton created once at server startup, not per-request -- so Next.js's automatic fetch-cache
 * patching (which the `dynamic = 'force-dynamic'` route export relies on) doesn't reliably apply to the fetch
 * calls Supabase's client makes internally. Without this, pages could silently serve stale/cached query
 * results regardless of route-level cache config. Forcing `cache: 'no-store'` here, once, guarantees every
 * Supabase call in the app always hits the database instead of a stale cache.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
  global: {
    fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' })
  }
});

export const PROPERTY_PHOTOS_BUCKET = 'property-photos';
export const RENTAL_PHOTOS_BUCKET = 'rental-photos';
