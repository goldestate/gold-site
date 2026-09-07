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
  active: boolean;
  redemptionCount: number;
};

export async function readActiveCode(compoundId: string): Promise<CompoundCode | null> {
  const { data, error } = await supabase
    .from('compound_codes')
    .select('id, compound_id, code, active')
    .eq('compound_id', compoundId)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { count, error: countError } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('code_id', data.id);
  if (countError) throw countError;
  return {
    id: data.id as string,
    compoundId: data.compound_id as string,
    code: data.code as string,
    active: data.active as boolean,
    redemptionCount: count ?? 0
  };
}

/**
 * Rotate is not revoke. The old code stops accepting NEW redemptions, but existing
 * redemption rows survive, so a guest already unlocked keeps access for their stay.
 * Cutting everyone off is `revokeAllCodes`, a separate and deliberately louder action.
 */
export async function rotateCode(compoundId: string): Promise<CompoundCode> {
  const { error: deactivateError } = await supabase
    .from('compound_codes')
    .update({ active: false, rotated_at: new Date().toISOString() })
    .eq('compound_id', compoundId)
    .eq('active', true);
  if (deactivateError) throw deactivateError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCompoundCode();
    const { data, error } = await supabase
      .from('compound_codes')
      .insert({ compound_id: compoundId, code })
      .select()
      .single();
    if (!error) {
      return { id: data.id, compoundId, code: data.code, active: true, redemptionCount: 0 };
    }
    // 23505 = unique violation: the generated code already exists, so try another.
    if ((error as { code?: string }).code !== '23505') throw error;
  }
  throw new Error('Could not generate a unique code.');
}

/** Hard cut-off: drops every redemption for this compound so unlocked devices lose access. */
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

/** Returns null for both "no such code" and "inactive code" -- callers must not distinguish them. */
export async function redeemCode(code: string, deviceId: string): Promise<Compound | null> {
  const { data, error } = await supabase
    .from('compound_codes')
    .select('id, compound_id, active')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

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
