import { supabase, PROPERTY_PHOTOS_BUCKET, RENTAL_PHOTOS_BUCKET } from './supabase';
import { r2Config, r2Get, r2List, r2Put, type R2Config } from './r2';
import {
  NDA_FOLDER,
  PHOTO_CACHE_CONTROL,
  cloudflarePhotoUrl,
  listSupabaseFiles,
  photoDatesKey,
  photoLocation,
  type PhotoFolder,
  type SupabaseFile
} from './file-storage';
import { forgetCachedProperties } from './properties-store';

/**
 * Server-only. The one-time move of GOLD's files from Supabase Storage to
 * Cloudflare R2, run from the admin's Storage page in three steps, each safe
 * to run again because it only does what is left:
 *
 *   1. copy     every file to R2 under the same folder and name, a batch per call;
 *   2. links    photo links in listings, the Rental Desk and the deleted-units
 *               record are pointed at the copies;
 *   3. cleanup  the Supabase copies go, but only where R2 holds the same file at
 *               the same size and no link still uses it, a batch per call.
 */

type Folder = { name: PhotoFolder | typeof NDA_FOLDER; bucket: (r2: R2Config) => string };

const FOLDERS: Folder[] = [
  { name: PROPERTY_PHOTOS_BUCKET, bucket: (r2) => r2.photosBucket },
  { name: RENTAL_PHOTOS_BUCKET, bucket: (r2) => r2.photosBucket },
  { name: NDA_FOLDER, bucket: (r2) => r2.privateBucket }
];

type SourceFile = SupabaseFile & { folder: Folder };

const keyOf = (file: SourceFile) => `${file.folder.name}/${file.path}`;

function requireR2(): R2Config {
  const r2 = r2Config();
  if (!r2) throw new Error('Cloudflare R2 is not set up.');
  return r2;
}

async function sourceFiles(): Promise<SourceFile[]> {
  const lists = await Promise.all(
    FOLDERS.map(async (folder) => (await listSupabaseFiles(folder.name)).map((file) => ({ ...file, folder })))
  );
  return lists.flat();
}

/** What R2 already holds, by folder/path, with each object's size. */
async function copiedFiles(r2: R2Config): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  const lists = await Promise.all(FOLDERS.map((folder) => r2List(folder.bucket(r2), `${folder.name}/`)));
  for (const list of lists) for (const object of list) sizes.set(object.key, object.size);
  return sizes;
}

/** On R2 already, at the size Supabase reports (when it reports one). */
function isCopied(copied: Map<string, number>, file: SourceFile): boolean {
  const size = copied.get(keyOf(file));
  return size !== undefined && (file.size === 0 || size === file.size);
}

// ---------------------------------------------------------------------------
// The rows that hold photo links.
// ---------------------------------------------------------------------------

const PAGE = 1000;

function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'PGRST205' || code === '42P01';
}

type LinkTable = {
  table: string;
  column: 'images' | 'photos' | 'snapshot';
  /** The links in a row's column, and the column's new value with links swapped. */
  read: (value: unknown) => string[];
  write: (value: unknown, swap: (url: string) => string) => unknown;
};

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const swapList = (value: unknown, swap: (url: string) => string) =>
  Array.isArray(value) ? value.map((item) => (typeof item === 'string' ? swap(item) : item)) : value;

// Properties first: an in-house Rental Desk listing copies its property's
// photos when the property changes, so most of its links follow on their own.
const LINK_TABLES: LinkTable[] = [
  { table: 'properties', column: 'images', read: strings, write: swapList },
  { table: 'rental_listings', column: 'photos', read: strings, write: swapList },
  {
    table: 'property_deletions',
    column: 'snapshot',
    read: (value) => strings((value as { images?: unknown } | null)?.images),
    write: (value, swap) =>
      value && typeof value === 'object'
        ? { ...(value as Record<string, unknown>), images: swapList((value as { images?: unknown }).images, swap) }
        : value
  }
];

async function readLinkRows(source: LinkTable): Promise<{ id: string; value: unknown }[]> {
  const rows: { id: string; value: unknown }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(source.table)
      .select(`id, ${source.column}`)
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) {
      // property_deletions only exists once migration 008 has run.
      if (isMissingTable(error)) return rows;
      throw error;
    }
    const page = (data ?? []) as unknown as Record<string, unknown>[];
    for (const row of page) rows.push({ id: String(row.id), value: row[source.column] });
    if (page.length < PAGE) return rows;
  }
}

/** Every photo still linked on Supabase, as folder/name. */
async function supabaseLinks(): Promise<Set<string>> {
  const linked = new Set<string>();
  for (const source of LINK_TABLES) {
    for (const row of await readLinkRows(source)) {
      for (const url of source.read(row.value)) {
        const at = photoLocation(url);
        if (at?.store === 'supabase') linked.add(`${at.folder}/${at.name}`);
      }
    }
  }
  return linked;
}

// ---------------------------------------------------------------------------
// Status and the three steps.
// ---------------------------------------------------------------------------

export type MoveStatus = {
  /** Cloudflare is set up. */
  ready: boolean;
  /** Files still on Supabase. */
  onSupabase: number;
  /** Of those, how many R2 already holds. */
  copied: number;
  /** Photo links still pointing at Supabase, at a file that is there or already copied. */
  linksOnSupabase: number;
  /** Links at files that were already gone from Supabase before the move: those photos were missing anyway. */
  brokenLinks: number;
};

export async function readMoveStatus(): Promise<MoveStatus> {
  const r2 = r2Config();
  const [files, links] = await Promise.all([sourceFiles(), supabaseLinks()]);
  const copied = r2 ? await copiedFiles(r2) : new Map<string, number>();
  const present = new Set(files.map(keyOf));
  const broken = [...links].filter((key) => !present.has(key) && !copied.has(key)).length;
  return {
    ready: r2 !== null,
    onSupabase: files.length,
    copied: files.filter((file) => isCopied(copied, file)).length,
    linksOnSupabase: links.size - broken,
    brokenLinks: broken
  };
}

async function eachLimited<T>(items: T[], limit: number, task: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await task(items[next++]);
  });
  await Promise.all(workers);
}

export type CopyResult = { copied: number; failed: string[]; left: number };

/** Copies the next batch of files that R2 doesn't hold yet. */
export async function copyBatch(limit = 30): Promise<CopyResult> {
  const r2 = requireR2();
  const [files, copied] = await Promise.all([sourceFiles(), copiedFiles(r2)]);
  const todo = files.filter((file) => !isCopied(copied, file));
  const batch = todo.slice(0, limit);
  const failed: string[] = [];
  const dates = new Map<PhotoFolder, Record<string, string>>();

  await eachLimited(batch, 5, async (file) => {
    try {
      const { data, error } = await supabase.storage.from(file.folder.name).download(file.path);
      if (error) throw error;
      const body = new Uint8Array(await data.arrayBuffer());
      const isPhoto = file.folder.name !== NDA_FOLDER;
      await r2Put(file.folder.bucket(r2), keyOf(file), body, file.mimetype, isPhoto ? PHOTO_CACHE_CONTROL : undefined);
      if (isPhoto && file.createdAt) {
        const folder = file.folder.name as PhotoFolder;
        dates.set(folder, { ...(dates.get(folder) ?? {}), [file.path]: file.createdAt });
      }
    } catch (error) {
      console.error(`Could not copy ${keyOf(file)} to Cloudflare`, error);
      failed.push(keyOf(file));
    }
  });

  // R2 dates every object to the moment it was written; the photo history on
  // the Properties dashboard needs the original upload days.
  for (const [folder, added] of dates) {
    const key = photoDatesKey(folder);
    const existing = await r2Get(r2.privateBucket, key);
    let known: Record<string, string> = {};
    if (existing) {
      try {
        known = JSON.parse(new TextDecoder().decode(existing)) as Record<string, string>;
      } catch {
        known = {};
      }
    }
    await r2Put(r2.privateBucket, key, new TextEncoder().encode(JSON.stringify({ ...known, ...added })), 'application/json');
  }

  const done = batch.length - failed.length;
  return { copied: done, failed, left: todo.length - done };
}

export type LinksResult = { switched: number; notCopied: number };

/** Points every photo link that R2 has a copy of at the copy. */
export async function switchLinks(): Promise<LinksResult> {
  const r2 = requireR2();
  const copied = await copiedFiles(r2);
  let switched = 0;
  let notCopied = 0;
  const swap = (url: string): string => {
    const at = photoLocation(url);
    if (at?.store !== 'supabase') return url;
    const target = cloudflarePhotoUrl(at);
    if (!target || !copied.has(`${at.folder}/${at.name}`)) {
      notCopied += 1;
      return url;
    }
    switched += 1;
    return target;
  };

  for (const source of LINK_TABLES) {
    for (const row of await readLinkRows(source)) {
      const before = source.read(row.value);
      if (!before.some((url) => photoLocation(url)?.store === 'supabase')) continue;
      const value = source.write(row.value, swap);
      if (JSON.stringify(source.read(value)) === JSON.stringify(before)) continue;
      const { error } = await supabase
        .from(source.table)
        .update({ [source.column]: value })
        .eq('id', row.id);
      if (error) throw error;
    }
  }

  forgetCachedProperties();
  return { switched, notCopied };
}

export type CleanupResult = { deleted: number; kept: number; left: number };

/**
 * Deletes the next batch of Supabase copies that are safe to delete: R2 holds
 * the same file at the same size, and no link points at the Supabase one.
 */
export async function cleanupBatch(limit = 200): Promise<CleanupResult> {
  const r2 = requireR2();
  const [files, copied, linked] = await Promise.all([sourceFiles(), copiedFiles(r2), supabaseLinks()]);
  const safe = files.filter((file) => isCopied(copied, file) && !linked.has(keyOf(file)));
  const batch = safe.slice(0, limit);

  const byFolder = new Map<string, string[]>();
  for (const file of batch) byFolder.set(file.folder.name, [...(byFolder.get(file.folder.name) ?? []), file.path]);
  for (const [folder, paths] of byFolder) {
    const { error } = await supabase.storage.from(folder).remove(paths);
    if (error) throw error;
  }

  return { deleted: batch.length, kept: files.length - safe.length, left: safe.length - batch.length };
}
