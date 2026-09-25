import { supabase } from './supabase';
import { generateCompoundCode } from './compound-code';
import {
  isPlaceCategory,
  isPlaceTier,
  type PlaceCategoryValue,
  type PlaceTierValue
} from './directory-taxonomy';
import { normalizeLegacyLocation, type LocationValue } from './property-taxonomy';
import { DEFAULT_RADIUS_KM, isValidPin, type Pin } from './map-pin';

export type Compound = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  location: LocationValue;
  matchNames: string[];
  active: boolean;
  /** Where it is, or null until staff set it. Without one, no phone can find it by location. */
  pin: Pin | null;
  /** How far from the pin still counts as this compound, in km. */
  radiusKm: number;
  /** 'auto' when the site found it on OpenStreetMap, 'staff' when someone fixed it by hand. */
  pinSource: PinSource | null;
};

export type PinSource = 'auto' | 'staff';

export type Place = {
  id: string;
  compoundId: string;
  category: PlaceCategoryValue;
  nameEn: string;
  nameAr: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  tier: PlaceTierValue;
  notesEn: string;
  notesAr: string;
  sortOrder: number;
  active: boolean;
};

export type PlaceInput = Omit<Place, 'id'>;

type CompoundRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  location: string;
  match_names: unknown;
  active: boolean;
  // Absent until migration 006 is run: rows are read with select('*'), so a
  // database without the columns reads as "no pin" rather than an error.
  lat?: unknown;
  lng?: unknown;
  radius_km?: unknown;
  pin_source?: unknown;
};

type PlaceRow = {
  id: string;
  compound_id: string;
  category: string;
  name_en: string;
  name_ar: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  tier: string;
  notes_en: string;
  notes_ar: string;
  sort_order: number;
  active: boolean;
};

function rowToCompound(row: CompoundRow): Compound {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    location: normalizeLegacyLocation(row.location),
    matchNames: Array.isArray(row.match_names)
      ? row.match_names.filter((item): item is string => typeof item === 'string')
      : [],
    active: row.active,
    pin: readPin(row.lat, row.lng),
    radiusKm: readRadius(row.radius_km),
    pinSource: row.pin_source === 'auto' || row.pin_source === 'staff' ? row.pin_source : null
  };
}

/** double precision arrives as a number; tolerate a numeric string too. */
function readNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function readPin(lat: unknown, lng: unknown): Pin | null {
  const pin = { lat: readNumber(lat), lng: readNumber(lng) };
  if (pin.lat === null || pin.lng === null) return null;
  const complete = { lat: pin.lat, lng: pin.lng };
  return isValidPin(complete) ? complete : null;
}

function readRadius(value: unknown): number {
  const radius = readNumber(value);
  return radius !== null && radius > 0 ? radius : DEFAULT_RADIUS_KM;
}

/**
 * Whether an error is the database not having the pin columns yet -- migration
 * 006 not run. PostgREST answers an update naming an unknown column with
 * PGRST204 ("could not find the 'lat' column"); Postgres itself with 42703.
 */
export function isMissingPinColumns(error: unknown): boolean {
  const code = postgresErrorCode(error);
  if (code !== 'PGRST204' && code !== '42703') return false;
  const message = String((error as { message?: unknown } | null)?.message ?? '');
  return /\b(lat|lng|radius_km|pin_source)\b/.test(message);
}

function rowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    compoundId: row.compound_id,
    // A category this build does not know (typed in the SQL editor, or added
    // by a newer admin) lands in 'other', which the app also has. It used to
    // become 'clubhouse', which put an ambulance under the pool bar and then
    // copied that label into every compound it was copied to.
    category: isPlaceCategory(row.category) ? row.category : 'other',
    nameEn: row.name_en,
    nameAr: row.name_ar,
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    // An unrecognised tier must never fall open. Anything we cannot positively
    // identify as 'public' is treated as vetted and withheld.
    tier: isPlaceTier(row.tier) ? row.tier : 'vetted',
    notesEn: row.notes_en,
    notesAr: row.notes_ar,
    sortOrder: row.sort_order,
    active: row.active
  };
}

function placeInputToRow(input: PlaceInput) {
  return {
    compound_id: input.compoundId,
    category: input.category,
    name_en: input.nameEn,
    name_ar: input.nameAr,
    phone: input.phone,
    whatsapp: input.whatsapp,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    tier: input.tier,
    notes_en: input.notesEn,
    notes_ar: input.notesAr,
    sort_order: input.sortOrder,
    active: input.active
  };
}

/** Postgres error code from a Supabase error, e.g. '23505' for a unique violation. */
export function postgresErrorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Supabase's API returns at most 1,000 rows per request (the project default)
 * and says nothing when it truncates. Reads that span every compound page
 * through with `range` so a count never quietly stops at 1,000.
 */
const PAGE_SIZE = 1000;

/**
 * Callers select with `{ count: 'exact' }`, and paging stops at the total the
 * database reports rather than at the first short page: if the project's "Max
 * rows" setting is ever lowered below PAGE_SIZE, every page comes back short,
 * and stopping there would truncate exactly as this exists to prevent. Each
 * page starts where the rows received so far end, for the same reason.
 */
async function readAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown; count: number | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const { data, error, count } = await page(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length === 0) return rows;
    // No total (a caller that forgot the count option): fall back to the short page.
    if (count === null ? batch.length < PAGE_SIZE : rows.length >= count) return rows;
  }
}

/** Runs `task` over `items` with at most `limit` requests in flight, keeping order. */
async function mapLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ============================================================
// Compounds
// ============================================================

export async function readCompounds(includeInactive = false): Promise<Compound[]> {
  let query = supabase.from('compounds').select('*').order('name_en');
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as CompoundRow[]).map(rowToCompound);
}

export async function getCompoundBySlug(slug: string): Promise<Compound | null> {
  const { data, error } = await supabase.from('compounds').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? rowToCompound(data as CompoundRow) : null;
}

export async function createCompound(input: {
  slug: string;
  nameEn: string;
  nameAr: string;
  location: LocationValue;
  matchNames: string[];
}): Promise<Compound> {
  const { data, error } = await supabase
    .from('compounds')
    .insert({
      slug: input.slug,
      name_en: input.nameEn,
      name_ar: input.nameAr,
      location: input.location,
      match_names: input.matchNames
    })
    .select()
    .single();
  if (error) throw error;
  return rowToCompound(data as CompoundRow);
}

/**
 * Renames, moves, hides or re-maps a compound. Returns null when no compound
 * has that id (deleted in another tab), so the route can answer 404.
 *
 * The slug is deliberately not editable: phones that redeemed a code store the
 * compound by slug, and the admin URL is built from it. A rename changes what
 * people read, never what the app keys on.
 *
 * `matchNames` are the listing names that resolve to this compound. Editable
 * because the answer is not derivable from the data: "Marassi Marina" is part
 * of Marassi, and no amount of string comparison establishes that -- only GOLD
 * knows. Compound suggestions read them, so a spelling mapped here is never
 * offered again as a new compound.
 *
 * `active: false` hides the compound from the app (/api/compounds, the public
 * places route and entitlements all filter on it) and stops its codes
 * unlocking (redeemCode). Nothing is deleted, so it can be shown again.
 *
 * `pin` and `radiusKm` put the compound on the map, which is how the app finds
 * it from a guest's location. They need migration 006: without it the update
 * fails, and isMissingPinColumns tells that apart from any other failure.
 */
export async function updateCompound(
  id: string,
  patch: Partial<
    Pick<Compound, 'nameEn' | 'nameAr' | 'location' | 'active' | 'matchNames' | 'pin' | 'radiusKm' | 'pinSource'>
  >
): Promise<Compound | null> {
  const row: Record<string, unknown> = {};
  if (patch.nameEn !== undefined) row.name_en = patch.nameEn;
  if (patch.nameAr !== undefined) row.name_ar = patch.nameAr;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.matchNames !== undefined) row.match_names = patch.matchNames;
  // Both coordinates together, always: the table refuses half a pin.
  if (patch.pin !== undefined) {
    row.lat = patch.pin?.lat ?? null;
    row.lng = patch.pin?.lng ?? null;
    // Removing the pin removes who placed it; placing one says who did.
    row.pin_source = patch.pin ? patch.pinSource ?? 'staff' : null;
  }
  if (patch.radiusKm !== undefined) row.radius_km = patch.radiusKm;

  if (Object.keys(row).length === 0) {
    const { data, error } = await supabase.from('compounds').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToCompound(data as CompoundRow) : null;
  }

  const { data, error } = await supabase.from('compounds').update(row).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data ? rowToCompound(data as CompoundRow) : null;
}

/**
 * Stores a pin the site found by itself, unless staff have placed one since:
 * the lookup runs in the background, and a pin fixed by hand while it was on
 * its way must not be overwritten by the automatic one it was correcting.
 * Returns false when nothing was changed.
 */
export async function setAutoPin(id: string, pin: Pin): Promise<boolean> {
  const { data, error } = await supabase
    .from('compounds')
    .update({ lat: pin.lat, lng: pin.lng, pin_source: 'auto' })
    .eq('id', id)
    .or('pin_source.is.null,pin_source.eq.auto')
    .select('id');
  if (error) throw error;
  return (data ?? []).length > 0;
}

/**
 * Deletes a compound and, through ON DELETE CASCADE, its places, its codes and
 * every redemption of those codes. Phones that had it unlocked lose it at their
 * next entitlement check, because nothing is left to entitle them. Returns false
 * when nothing was deleted.
 */
export async function deleteCompound(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('compounds').delete().eq('id', id).select('id');
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

export type CompoundSummary = {
  compound: Compound;
  /** Every entry, active or not -- what staff see when they open it. */
  placeCount: number;
  /** Categories with at least one active entry. */
  filledCategories: PlaceCategoryValue[];
  liveCodes: number;
  /** Phones that redeemed one of the live codes. */
  unlocked: number;
};

/**
 * Everything the directory index shows, in one read per table instead of three
 * per compound. The old page ran readAllPlaces plus readCodes (two queries) for
 * every compound, so 'Add all' on thirty suggestions turned one page view into
 * ninety-odd Supabase calls, repeated on every refresh.
 *
 * Only live codes are read: the index shows how many guests hold one now, and
 * the full history lives on each compound's own page.
 */
export async function readDirectorySummary(): Promise<CompoundSummary[]> {
  const now = new Date().toISOString();
  const [compounds, places, codes] = await Promise.all([
    readCompounds(true),
    readAllPages<{ compound_id: string; category: string; active: boolean }>((from, to) =>
      supabase
        .from('places')
        .select('compound_id, category, active', { count: 'exact' })
        .order('id')
        .range(from, to)
    ),
    readAllPages<CodeRow>((from, to) =>
      supabase
        .from('compound_codes')
        .select(CODE_COLUMNS, { count: 'exact' })
        .eq('active', true)
        // The timestamp is quoted because PostgREST reserves '.' and ':' in or().
        .or(`expires_at.is.null,expires_at.gt."${now}"`)
        .order('id')
        .range(from, to)
    )
  ]);

  const liveCodes = codes.map((row) => rowToCode(row, 0)).filter(isLive);
  const counts = await redemptionCounts(liveCodes.map((code) => code.id));

  const byCompound = new Map(
    compounds.map((compound) => [
      compound.id,
      { placeCount: 0, filled: new Set<PlaceCategoryValue>(), liveCodes: 0, unlocked: 0 }
    ])
  );
  for (const place of places) {
    const entry = byCompound.get(place.compound_id);
    if (!entry) continue;
    entry.placeCount += 1;
    if (place.active) entry.filled.add(isPlaceCategory(place.category) ? place.category : 'other');
  }
  for (const code of liveCodes) {
    const entry = byCompound.get(code.compoundId);
    if (!entry) continue;
    entry.liveCodes += 1;
    entry.unlocked += counts.get(code.id) ?? 0;
  }

  return compounds.map((compound) => {
    const entry = byCompound.get(compound.id)!;
    return {
      compound,
      placeCount: entry.placeCount,
      filledCategories: [...entry.filled],
      liveCodes: entry.liveCodes,
      unlocked: entry.unlocked
    };
  });
}

/**
 * The name and region of every listing, published or not, for compound
 * suggestions. Two columns rather than readProperties' select *, which pulls
 * every description and photo list just to read the part before the dash.
 */
export async function readListingNames(): Promise<{ name: string; location: LocationValue }[]> {
  const rows = await readAllPages<{ name: unknown; location: string }>((from, to) =>
    supabase.from('properties').select('name, location', { count: 'exact' }).order('id').range(from, to)
  );
  return rows
    .filter((row): row is { name: string; location: string } => typeof row.name === 'string')
    .map((row) => ({ name: row.name, location: normalizeLegacyLocation(row.location) }));
}

// ============================================================
// Places
// ============================================================

/** Public tier only. The unlock endpoint is the only path that returns vetted rows. */
export async function readPublicPlaces(compoundId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('compound_id', compoundId)
    .eq('tier', 'public')
    .eq('active', true)
    .order('sort_order')
    .order('name_en')
    .order('id');
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

export async function readVettedPlaces(compoundId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('compound_id', compoundId)
    .eq('tier', 'vetted')
    .eq('active', true)
    .order('sort_order')
    .order('name_en')
    .order('id');
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

/**
 * Admin view: every place regardless of tier or active flag.
 *
 * Same order as the guest reads (sort_order, then name, then id as a final
 * tiebreak), so the admin list shows entries in the order the app does and no
 * longer reshuffles within a category after an edit. The editor groups by
 * category itself.
 */
export async function readAllPlaces(compoundId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('compound_id', compoundId)
    .order('sort_order')
    .order('name_en')
    .order('id');
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

export async function createPlaces(inputs: PlaceInput[]): Promise<Place[]> {
  if (inputs.length === 0) return [];
  const { data, error } = await supabase.from('places').insert(inputs.map(placeInputToRow)).select();
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

/** Returns null when no place has that id (deleted in another tab), so the route can answer 404. */
export async function updatePlace(id: string, patch: Partial<PlaceInput>): Promise<Place | null> {
  const row: Record<string, unknown> = {};
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.nameEn !== undefined) row.name_en = patch.nameEn;
  if (patch.nameAr !== undefined) row.name_ar = patch.nameAr;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.lat !== undefined) row.lat = patch.lat;
  if (patch.lng !== undefined) row.lng = patch.lng;
  if (patch.tier !== undefined) row.tier = patch.tier;
  if (patch.notesEn !== undefined) row.notes_en = patch.notesEn;
  if (patch.notesAr !== undefined) row.notes_ar = patch.notesAr;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.active !== undefined) row.active = patch.active;

  // An empty patch is a read: PostgREST rejects an UPDATE with no columns.
  if (Object.keys(row).length === 0) {
    const { data, error } = await supabase.from('places').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToPlace(data as PlaceRow) : null;
  }

  // maybeSingle, not single: zero rows is "that entry is gone", not a failure.
  const { data, error } = await supabase.from('places').update(row).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data ? rowToPlace(data as PlaceRow) : null;
}

/** Returns false when nothing was deleted, so the route can answer 404 instead of a false "done". */
export async function deletePlace(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('places').delete().eq('id', id).select('id');
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

// ============================================================
// Codes
// ============================================================

export type CompoundCode = {
  id: string;
  compoundId: string;
  code: string;
  /** Free text: "Ahmed, unit 12", "Owners". Nothing downstream parses it. */
  label: string;
  active: boolean;
  /** Null means it stays live until revoked. */
  expiresAt: string | null;
  createdAt: string;
  redemptionCount: number;
};

type CodeRow = {
  id: string;
  compound_id: string;
  code: string;
  label: unknown;
  active: boolean;
  expires_at: unknown;
  created_at: unknown;
};

function rowToCode(row: CodeRow, redemptionCount: number): CompoundCode {
  return {
    id: row.id,
    compoundId: row.compound_id,
    code: row.code,
    label: typeof row.label === 'string' ? row.label : '',
    active: row.active,
    expiresAt: typeof row.expires_at === 'string' ? row.expires_at : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    redemptionCount
  };
}

/** A code is redeemable while it is active and either has no end date or has not reached it. */
function isLive(code: { active: boolean; expiresAt: string | null }): boolean {
  if (!code.active) return false;
  return code.expiresAt === null || new Date(code.expiresAt).getTime() > Date.now();
}

const CODE_COLUMNS = 'id, compound_id, code, label, active, expires_at, created_at';

/**
 * Code ids per redemption lookup. A hundred UUIDs keep the request URL near
 * 4 KB, well inside what the API accepts.
 */
const CODE_ID_CHUNK = 100;

/**
 * How many phones redeemed each code, counted from the `code_id` of every
 * redemption row.
 *
 * The first version read `.in('code_id', [every code ever issued])` in one
 * request, which Supabase silently cut off at 1,000 rows and which grew the
 * request URL with every stay until it failed. The fix after that sent one
 * count-only request per code, which is correct but grows with every stay the
 * compound has ever had: three hundred finished stays meant three hundred
 * requests on each refresh of the compound page. Now the ids go in chunks of a
 * hundred and each chunk pages past 1,000, so a compound's full history costs
 * a few requests, all in flight together.
 *
 * (PostgREST can count in the database with `redemptions(count)`, but that
 * depends on the project's aggregate settings, and a refusal there would take
 * down the whole compound page.)
 */
async function redemptionCounts(codeIds: string[]): Promise<Map<string, number>> {
  const counts = new Map(codeIds.map((id) => [id, 0]));
  const chunks: string[][] = [];
  for (let start = 0; start < codeIds.length; start += CODE_ID_CHUNK) {
    chunks.push(codeIds.slice(start, start + CODE_ID_CHUNK));
  }
  const pages = await mapLimited(chunks, 4, (ids) =>
    readAllPages<{ code_id: string }>((from, to) =>
      supabase
        .from('redemptions')
        .select('code_id', { count: 'exact' })
        .in('code_id', ids)
        .order('id')
        .range(from, to)
    )
  );
  for (const rows of pages) {
    for (const row of rows) counts.set(row.code_id, (counts.get(row.code_id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Every code for a compound, newest first, with how many devices redeemed each.
 *
 * Returns expired and revoked codes too. Staff need to see that the unit 12
 * code ended on the 14th, and how many phones it reached -- a list that
 * silently drops finished stays makes "why did this guest lose access"
 * unanswerable.
 */
export async function readCodes(compoundId: string): Promise<CompoundCode[]> {
  const rows = await readAllPages<CodeRow>((from, to) =>
    supabase
      .from('compound_codes')
      .select(CODE_COLUMNS, { count: 'exact' })
      .eq('compound_id', compoundId)
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to)
  );
  if (rows.length === 0) return [];
  const counts = await redemptionCounts(rows.map((row) => row.id));
  return rows.map((row) => rowToCode(row, counts.get(row.id) ?? 0));
}

/** Codes a guest could still redeem right now. */
export async function readLiveCodes(compoundId: string): Promise<CompoundCode[]> {
  return (await readCodes(compoundId)).filter(isLive);
}

/**
 * Issues a code without touching the others.
 *
 * This is the change from `rotateCode`, which deactivated every existing code
 * before making one. Two guests staying at the same compound need two codes at
 * once, ending on different days.
 *
 * Returns null when the compound does not exist (deleted in another tab), so
 * the route can answer 404 rather than 500.
 */
export async function createCode(input: {
  compoundId: string;
  label: string;
  expiresAt: string | null;
}): Promise<CompoundCode | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCompoundCode();
    const { data, error } = await supabase
      .from('compound_codes')
      .insert({
        compound_id: input.compoundId,
        code,
        label: input.label,
        expires_at: input.expiresAt
      })
      .select(CODE_COLUMNS)
      .single();
    if (!error) return rowToCode(data as CodeRow, 0);
    // 23503 = foreign key violation: no compound with that id.
    if (postgresErrorCode(error) === '23503') return null;
    // 23505 = unique violation: the generated code already exists, so try another.
    if (postgresErrorCode(error) !== '23505') throw error;
  }
  throw new Error('Could not generate a unique code.');
}

/**
 * Moves a live code's end date: a guest extends by two nights, or leaves early.
 * The guest keeps the same code and link, and the phone picks the new date up at
 * its next entitlement check. Only an active code can be changed -- a revoked
 * code stays revoked. Returns null when no active code has that id.
 */
export async function setCodeExpiry(codeId: string, expiresAt: string | null): Promise<CompoundCode | null> {
  const { data, error } = await supabase
    .from('compound_codes')
    .update({ expires_at: expiresAt })
    .eq('id', codeId)
    .eq('active', true)
    .select(CODE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const counts = await redemptionCounts([codeId]);
  return rowToCode(data as CodeRow, counts.get(codeId) ?? 0);
}

/**
 * Ends one code. Scoped to this code only -- everyone else's stay is untouched.
 *
 * Deactivating is enough to reach a phone: readDeviceEntitlements only counts
 * live codes (isLive checks `active`), and redeemCode refuses inactive ones.
 * The redemption rows are kept, so the finished list still says how many
 * phones the code reached. (It used to delete them, which zeroed that count.)
 *
 * Returns false when no code has that id. Revoking an already revoked code is
 * a success, and keeps its original rotated_at.
 */
export async function revokeCode(codeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('compound_codes')
    .update({ active: false, rotated_at: new Date().toISOString() })
    .eq('id', codeId)
    .eq('active', true)
    .select('id');
  if (error) throw error;
  if (Array.isArray(data) && data.length > 0) return true;

  const { data: existing, error: readError } = await supabase
    .from('compound_codes')
    .select('id')
    .eq('id', codeId)
    .maybeSingle();
  if (readError) throw readError;
  return Boolean(existing);
}

/**
 * Hard cut-off: ends every live code for a compound. Codes that already ended
 * keep their own dates, and every redemption row is kept for the counts; access
 * ends because entitlements only count live codes. Returns how many it ended.
 */
export async function revokeAllCodes(compoundId: string): Promise<number> {
  const { data, error } = await supabase
    .from('compound_codes')
    .update({ active: false, rotated_at: new Date().toISOString() })
    .eq('compound_id', compoundId)
    .eq('active', true)
    .select('id');
  if (error) throw error;
  return Array.isArray(data) ? data.length : 0;
}

/**
 * Compounds this device still has live access to, with their vetted places.
 *
 * The app calls this on launch. Without it a revoked or expired code never
 * reaches the phone: the app stores the compound slug and the vetted list
 * locally and, before this existed, had no reason to ask the server again --
 * so "cut off everyone" deleted rows and no device ever noticed.
 *
 * Access is decided by the code, not by the redemption row: a row only says
 * this phone once redeemed it, and isLive below drops codes that were revoked
 * or have ended, as the `active` filter drops hidden compounds. That is why
 * revoking keeps the rows (they are the phone counts) and still cuts access.
 *
 * The places ride along because the same staleness applies to content: a plumber
 * added after a guest unlocked would otherwise never appear for them. This
 * returns only what the device already redeemed, keyed by an identifier only it
 * holds, so it discloses nothing a fresh unlock would not.
 */
export async function readDeviceEntitlements(
  deviceId: string
): Promise<{ slug: string; places: Place[] }[]> {
  const { data, error } = await supabase
    .from('redemptions')
    .select('code_id')
    .eq('device_id', deviceId);
  if (error) throw error;

  const codeIds = [...new Set(((data ?? []) as { code_id: string }[]).map((row) => row.code_id))];
  if (codeIds.length === 0) return [];

  const { data: codes, error: codeError } = await supabase
    .from('compound_codes')
    .select(CODE_COLUMNS)
    .in('id', codeIds);
  if (codeError) throw codeError;

  const liveCompoundIds = [
    ...new Set(
      ((codes ?? []) as CodeRow[])
        .map((row) => rowToCode(row, 0))
        .filter(isLive)
        .map((code) => code.compoundId)
    )
  ];
  if (liveCompoundIds.length === 0) return [];

  const { data: compounds, error: compoundError } = await supabase
    .from('compounds')
    .select('id, slug')
    .in('id', liveCompoundIds)
    .eq('active', true);
  if (compoundError) throw compoundError;

  return Promise.all(
    ((compounds ?? []) as { id: string; slug: string }[]).map(async (compound) => ({
      slug: compound.slug,
      places: await readVettedPlaces(compound.id)
    }))
  );
}

/**
 * Returns null for "no such code", "inactive code", "expired code" and "hidden
 * compound" alike -- callers must not distinguish them.
 */
export async function redeemCode(code: string, deviceId: string): Promise<Compound | null> {
  const { data, error } = await supabase
    .from('compound_codes')
    .select('id, compound_id, active, expires_at')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // An expired code is indistinguishable from a wrong one to the caller, same as
  // an inactive one -- the endpoint above must not tell anyone which it was.
  const expiresAt = typeof data.expires_at === 'string' ? data.expires_at : null;
  if (expiresAt !== null && new Date(expiresAt).getTime() <= Date.now()) return null;

  // Checked before the redemption is written. A hidden compound is missing from
  // /api/compounds, so the app could not show it anyway: it closed the unlock
  // sheet as if the code worked and stayed locked, and entitlements dropped it
  // again at the next launch. Now it is the same 404 as a wrong code, and no
  // redemption row is left behind.
  const { data: compound, error: compoundError } = await supabase
    .from('compounds')
    .select('*')
    .eq('id', data.compound_id)
    .eq('active', true)
    .maybeSingle();
  if (compoundError) throw compoundError;
  if (!compound) return null;

  const { error: upsertError } = await supabase
    .from('redemptions')
    .upsert(
      { code_id: data.id, device_id: deviceId, last_seen_at: new Date().toISOString() },
      { onConflict: 'code_id,device_id' }
    );
  if (upsertError) throw upsertError;

  return rowToCompound(compound as CompoundRow);
}
