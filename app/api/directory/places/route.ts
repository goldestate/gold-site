import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createPlaces, postgresErrorCode, readAllPlaces, type PlaceInput } from '@/lib/directory-store';
import { isPlaceCategory, isPlaceTier, placeKey } from '@/lib/directory-taxonomy';
import { cleanPhone, whatsappFor } from '@/lib/phone';

export const dynamic = 'force-dynamic';

/** Checked before the database sees it: a malformed id is a 400, not a Postgres 22P02 and a 500. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const compoundId = request.nextUrl.searchParams.get('compoundId');
  if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });
  if (!UUID.test(compoundId)) return NextResponse.json({ error: 'Invalid compoundId.' }, { status: 400 });
  try {
    return NextResponse.json({ places: await readAllPlaces(compoundId) });
  } catch (error) {
    console.error('Failed to read places', error);
    return NextResponse.json({ error: 'Could not load places.' }, { status: 500 });
  }
}

/** A stored phone is digits only (a leading + kept), so the app's call button dials what it shows. */
function toPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = cleanPhone(value);
  return cleaned.replace(/^\+/, '').length > 0 ? cleaned : null;
}

function toPlaceInput(raw: unknown, compoundId: string): PlaceInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const nameEn = typeof value.nameEn === 'string' ? value.nameEn.trim() : '';
  if (!nameEn || !isPlaceCategory(value.category) || !isPlaceTier(value.tier)) return null;
  // Strict rather than coerced: Boolean('false') is true, and a fractional order
  // fails the integer column and takes the whole batch down with a 500.
  if (value.active !== undefined && typeof value.active !== 'boolean') return null;
  if (value.sortOrder !== undefined && !Number.isInteger(value.sortOrder)) return null;
  const optional = (key: string) => {
    const item = value[key];
    return typeof item === 'string' && item.trim().length > 0 ? item.trim() : null;
  };
  return {
    compoundId,
    category: value.category,
    nameEn,
    nameAr: typeof value.nameAr === 'string' ? value.nameAr.trim() : '',
    phone: toPhone(value.phone),
    // Kept only when the number can be on WhatsApp at all. Every admin client used
    // to send the phone here too, which gave landlines and hotlines a WhatsApp
    // button that opens a chat with nobody; this holds for any caller.
    whatsapp: typeof value.whatsapp === 'string' ? whatsappFor(value.whatsapp) : null,
    address: optional('address'),
    lat: typeof value.lat === 'number' && Number.isFinite(value.lat) ? value.lat : null,
    lng: typeof value.lng === 'number' && Number.isFinite(value.lng) ? value.lng : null,
    tier: value.tier,
    notesEn: typeof value.notesEn === 'string' ? value.notesEn.trim() : '',
    notesAr: typeof value.notesAr === 'string' ? value.notesAr.trim() : '',
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : 0,
    active: value.active === undefined ? true : value.active === true
  };
}

/**
 * Accepts one place or many, so the paste importer commits its whole preview at once.
 *
 * With `skipExisting: true` (the admin's add, paste and copy all send it), an entry
 * whose category and name are already listed in this compound is left out and
 * counted in `skipped`, unless that entry says `allowDuplicate: true` -- staff tapped
 * "Add anyway" for a second Ahmed the plumber. The admin checks the same thing
 * before sending, but against the list as it was last drawn: two copies or pastes
 * fired before the page refreshed would otherwise both land. Read-then-insert is
 * not atomic, so this narrows the window to one request rather than closing it; a
 * unique index cannot, because a real second Ahmed is allowed.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const value = (body ?? {}) as Record<string, unknown>;
  const compoundId = typeof value.compoundId === 'string' ? value.compoundId : '';
  if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });
  if (!UUID.test(compoundId)) return NextResponse.json({ error: 'Invalid compoundId.' }, { status: 400 });

  const rawPlaces = Array.isArray(value.places) ? value.places : [value.place];
  const inputs: { place: PlaceInput; allowDuplicate: boolean }[] = [];
  for (const raw of rawPlaces) {
    const parsed = toPlaceInput(raw, compoundId);
    if (!parsed) return NextResponse.json({ error: 'One or more entries are invalid.' }, { status: 400 });
    inputs.push({ place: parsed, allowDuplicate: (raw as Record<string, unknown>).allowDuplicate === true });
  }
  if (inputs.length === 0) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });

  try {
    let toCreate = inputs.map((item) => item.place);
    let skipped = 0;
    if (value.skipExisting === true) {
      // Only what is already stored: repeats inside one batch are the caller's to
      // judge (paste marks them, and a copied source may list two Ahmeds on purpose).
      const listed = new Set((await readAllPlaces(compoundId)).map(placeKey));
      toCreate = [];
      for (const { place, allowDuplicate } of inputs) {
        if (listed.has(placeKey(place)) && !allowDuplicate) {
          skipped += 1;
          continue;
        }
        toCreate.push(place);
      }
      // Everything was already there: nothing to insert, and not an error.
      if (toCreate.length === 0) return NextResponse.json({ places: [], skipped });
    }
    return NextResponse.json({ places: await createPlaces(toCreate), skipped }, { status: 201 });
  } catch (error) {
    // 23503: the compound id is well formed but no compound has it (deleted in
    // another tab, say). That is a missing thing, not a server fault.
    if (postgresErrorCode(error) === '23503') {
      return NextResponse.json({ error: 'That compound no longer exists.' }, { status: 404 });
    }
    console.error('Failed to create places', error);
    return NextResponse.json({ error: 'Could not save these entries.' }, { status: 500 });
  }
}
