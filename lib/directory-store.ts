import { supabase } from './supabase';
import { generateCompoundCode } from './compound-code';
import {
  isPlaceCategory,
  isPlaceTier,
  type PlaceCategoryValue,
  type PlaceTierValue
} from './directory-taxonomy';
import { normalizeLegacyLocation, type LocationValue } from './property-taxonomy';

export type Compound = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  location: LocationValue;
  matchNames: string[];
  active: boolean;
};

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
    active: row.active
  };
}

function rowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    compoundId: row.compound_id,
    category: isPlaceCategory(row.category) ? row.category : 'clubhouse',
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
 * The listing names that resolve to this compound. Editable because the answer
 * is not derivable from the data: "Marassi Marina" is part of Marassi, and no
 * amount of string comparison establishes that -- only GOLD knows.
 */
export async function updateCompoundMatchNames(id: string, matchNames: string[]): Promise<Compound> {
  const { data, error } = await supabase
    .from('compounds')
    .update({ match_names: matchNames })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToCompound(data as CompoundRow);
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
    .order('name_en');
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
    .order('name_en');
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

/** Admin view: every place regardless of tier or active flag. */
export async function readAllPlaces(compoundId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('compound_id', compoundId)
    .order('category')
    .order('sort_order');
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

export async function createPlaces(inputs: PlaceInput[]): Promise<Place[]> {
  if (inputs.length === 0) return [];
  const { data, error } = await supabase.from('places').insert(inputs.map(placeInputToRow)).select();
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

export async function updatePlace(id: string, patch: Partial<PlaceInput>): Promise<Place> {
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
  const { data, error } = await supabase.from('places').update(row).eq('id', id).select().single();
  if (error) throw error;
  return rowToPlace(data as PlaceRow);
}

export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase.from('places').delete().eq('id', id);
  if (error) throw error;
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

/**
 * Every code for a compound, newest first, with how many devices redeemed each.
 *
 * Returns expired and revoked codes too. Staff need to see that Ahmed's code
 * ended on the 14th -- a list that silently drops finished stays makes "why did
 * this guest lose access" unanswerable.
 */
export async function readCodes(compoundId: string): Promise<CompoundCode[]> {
  const { data, error } = await supabase
    .from('compound_codes')
    .select('id, compound_id, code, label, active, expires_at, created_at')
    .eq('compound_id', compoundId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as CodeRow[];
  if (rows.length === 0) return [];

  const { data: redemptions, error: countError } = await supabase
    .from('redemptions')
    .select('code_id')
    .in('code_id', rows.map((row) => row.id));
  if (countError) throw countError;

  const counts = new Map<string, number>();
  for (const row of (redemptions ?? []) as { code_id: string }[]) {
    counts.set(row.code_id, (counts.get(row.code_id) ?? 0) + 1);
  }
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
 */
export async function createCode(input: {
  compoundId: string;
  label: string;
  expiresAt: string | null;
}): Promise<CompoundCode> {
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
      .select('id, compound_id, code, label, active, expires_at, created_at')
      .single();
    if (!error) return rowToCode(data as CodeRow, 0);
    // 23505 = unique violation: the generated code already exists, so try another.
    if ((error as { code?: string }).code !== '23505') throw error;
  }
  throw new Error('Could not generate a unique code.');
}

/**
 * Ends one code and drops the devices that redeemed it.
 *
 * Deleting the redemptions is what makes this reach a phone: entitlements are
 * derived from those rows, so without the delete the guest keeps the list.
 * Scoped to this code only -- everyone else's stay is untouched.
 */
export async function revokeCode(codeId: string): Promise<void> {
  const { error: deleteError } = await supabase.from('redemptions').delete().eq('code_id', codeId);
  if (deleteError) throw deleteError;
  const { error } = await supabase
    .from('compound_codes')
    .update({ active: false, rotated_at: new Date().toISOString() })
    .eq('id', codeId);
  if (error) throw error;
}

/** Hard cut-off: ends every code for a compound and drops all its redemptions. */
export async function revokeAllCodes(compoundId: string): Promise<void> {
  const { data, error } = await supabase.from('compound_codes').select('id').eq('compound_id', compoundId);
  if (error) throw error;
  const ids = (data as { id: string }[]).map((row) => row.id);
  if (ids.length > 0) {
    const { error: deleteError } = await supabase.from('redemptions').delete().in('code_id', ids);
    if (deleteError) throw deleteError;
  }
  const { error: deactivateError } = await supabase
    .from('compound_codes')
    .update({ active: false, rotated_at: new Date().toISOString() })
    .eq('compound_id', compoundId);
  if (deactivateError) throw deactivateError;
}

/**
 * Compounds this device still has live access to, with their vetted places.
 *
 * The app calls this on launch. Without it a revoked or expired code never
 * reaches the phone: the app stores the compound slug and the vetted list
 * locally and, before this existed, had no reason to ask the server again --
 * so "cut off everyone" deleted rows and no device ever noticed.
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
    .select('id, compound_id, code, label, active, expires_at, created_at')
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

/** Returns null for both "no such code" and "inactive code" -- callers must not distinguish them. */
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

  const { error: upsertError } = await supabase
    .from('redemptions')
    .upsert(
      { code_id: data.id, device_id: deviceId, last_seen_at: new Date().toISOString() },
      { onConflict: 'code_id,device_id' }
    );
  if (upsertError) throw upsertError;

  const { data: compound, error: compoundError } = await supabase
    .from('compounds')
    .select('*')
    .eq('id', data.compound_id)
    .maybeSingle();
  if (compoundError) throw compoundError;
  return compound ? rowToCompound(compound as CompoundRow) : null;
}
