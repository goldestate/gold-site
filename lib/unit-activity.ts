import { supabase, PROPERTY_PHOTOS_BUCKET } from './supabase';
import { listPhotos } from './file-storage';
import { forgetCachedProperties, type Property } from './properties-store';
import { cairoDayOf } from './cairo-time';
import {
  isPropertyType,
  isUnitType,
  normalizeLegacyLocation,
  type LocationValue,
  type PropertyTypeValue,
  type UnitTypeValue
} from './property-taxonomy';

/**
 * What the Properties dashboard knows about the units that are NOT in the
 * properties table: the ones that were deleted, and the ones that were never
 * saved.
 *
 * Photos go up to storage the moment staff pick them, before the unit is saved,
 * and deleting a unit leaves its photos where they are. So the photo bucket is a
 * day-by-day record of what staff actually tried to upload: photos that no unit
 * uses belong to a unit that was never saved, or to one that was deleted.
 */

export type PhotoUploadDay = {
  /** Cairo calendar day, YYYY-MM-DD. */
  day: string;
  uploaded: number;
  /** Uploaded that day, and on no current unit. */
  unattached: number;
  /** Of the unattached, how many belonged to a unit in the deletion record. */
  fromDeleted: number;
};

export type PropertyDeletion = {
  id: string;
  propertyId: string;
  name: string;
  deletedAt: string;
  /** When the unit was first added, from the copy kept at deletion. */
  createdAt: string | null;
  location: LocationValue;
  propertyType: PropertyTypeValue;
  unitType: UnitTypeValue;
  images: string[];
};

type DeletionRow = {
  id: string;
  property_id: string;
  name: string;
  snapshot: Record<string, unknown> | null;
  deleted_at: string;
};

/** The table or function isn't there yet: migration 008 not run. */
function isMissing(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'PGRST205' || code === '42P01' || code === 'PGRST202' || code === '42883';
}

/** The file name inside the photo folder, from a photo's link on Supabase or Cloudflare. */
function photoName(url: string): string | null {
  const marker = `/${PROPERTY_PHOTOS_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  try {
    return decodeURIComponent(url.slice(at + marker.length).split('?')[0]) || null;
  } catch {
    return null;
  }
}

function namesIn(urls: string[], into: Set<string>) {
  for (const url of urls) {
    const name = photoName(url);
    if (name) into.add(name);
  }
}

/**
 * Photos uploaded per Cairo day, and how many of them no current unit uses.
 * Days with no uploads are left out.
 */
export async function readPhotoUploadDays(
  units: Property[],
  deletions: PropertyDeletion[] | null
): Promise<PhotoUploadDay[]> {
  const inUse = new Set<string>();
  for (const unit of units) namesIn(unit.images, inUse);
  const deleted = new Set<string>();
  for (const deletion of deletions ?? []) namesIn(deletion.images, deleted);

  const byDay = new Map<string, PhotoUploadDay>();
  for (const photo of await listPhotos(PROPERTY_PHOTOS_BUCKET)) {
    const day = cairoDayOf(photo.uploadedAt);
    const entry = byDay.get(day) ?? { day, uploaded: 0, unattached: 0, fromDeleted: 0 };
    entry.uploaded += 1;
    if (!inUse.has(photo.name)) {
      entry.unattached += 1;
      if (deleted.has(photo.name)) entry.fromDeleted += 1;
    }
    byDay.set(day, entry);
  }

  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function rowToDeletion(row: DeletionRow): PropertyDeletion {
  const snapshot = row.snapshot ?? {};
  const images = Array.isArray(snapshot.images)
    ? snapshot.images.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    deletedAt: row.deleted_at,
    createdAt: typeof snapshot.created_at === 'string' ? snapshot.created_at : null,
    location: normalizeLegacyLocation(snapshot.location),
    propertyType: isPropertyType(snapshot.property_type) ? snapshot.property_type : 'resale',
    unitType: isUnitType(snapshot.unit_type) ? snapshot.unit_type : 'apartment',
    images
  };
}

/** Deleted units, newest first, or null before migration 008 has run. */
export async function readPropertyDeletions(): Promise<PropertyDeletion[] | null> {
  const { data, error } = await supabase
    .from('property_deletions')
    .select('id, property_id, name, snapshot, deleted_at')
    .order('deleted_at', { ascending: false })
    .limit(500);
  if (error) {
    if (isMissing(error)) return null;
    throw error;
  }
  return (data as DeletionRow[]).map(rowToDeletion);
}

export type RestoreResult = 'restored' | 'not-found' | 'exists' | 'unavailable';

/** Puts a deleted unit back exactly as it was, under its old id and date. */
export async function restoreDeletedProperty(deletionId: string): Promise<RestoreResult> {
  const { data, error } = await supabase.rpc('restore_deleted_property', { p_deletion_id: deletionId });
  if (error) {
    if (isMissing(error)) return 'unavailable';
    // A unit with that id is already there.
    if ((error as { code?: unknown }).code === '23505') return 'exists';
    throw error;
  }
  if (data) forgetCachedProperties();
  return data ? 'restored' : 'not-found';
}
