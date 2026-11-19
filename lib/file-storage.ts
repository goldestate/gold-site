import { supabase, PROPERTY_PHOTOS_BUCKET, RENTAL_PHOTOS_BUCKET } from './supabase';
import { r2Config, r2Delete, r2Exists, r2Get, r2List, r2Put, r2SignedUrl } from './r2';

/**
 * Server-only. Where GOLD's files live.
 *
 * Supabase Storage held every file until November 2026. Once Cloudflare R2 is
 * set up (lib/r2.ts), every new file goes there instead, and the admin's
 * Storage page copies the older ones across and points their links at the
 * copies (lib/storage-move.ts). Until the old files are gone from Supabase,
 * reads fall back to them, so nothing breaks in between.
 *
 * Inside R2 each file keeps its Supabase bucket as a folder and its name:
 * property-photos/<name> and rental-photos/<name> in the public photos bucket,
 * nda-files/<agreement id>/<file> in the private one. A photo's link changes
 * only in its host.
 */

export type PhotoFolder = typeof PROPERTY_PHOTOS_BUCKET | typeof RENTAL_PHOTOS_BUCKET;
export const PHOTO_FOLDERS: PhotoFolder[] = [PROPERTY_PHOTOS_BUCKET, RENTAL_PHOTOS_BUCKET];

export const NDA_FOLDER = 'nda-files';
export type PrivateFolder = typeof NDA_FOLDER;

/** Photo names are unique and never overwritten, so browsers and Cloudflare can keep them for good. */
export const PHOTO_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** True once Cloudflare is set up: new files go there. */
export function onCloudflare(): boolean {
  return r2Config() !== null;
}

function photoUrl(photosUrl: string, folder: PhotoFolder, name: string): string {
  return `${photosUrl}/${folder}/${encodeURIComponent(name)}`;
}

/** Saves a new photo and returns the link it is shown at. */
export async function savePhoto(folder: PhotoFolder, name: string, body: Uint8Array, contentType: string): Promise<string> {
  const r2 = r2Config();
  if (r2) {
    await r2Put(r2.photosBucket, `${folder}/${name}`, body, contentType, PHOTO_CACHE_CONTROL);
    return photoUrl(r2.photosUrl, folder, name);
  }
  const { error } = await supabase.storage.from(folder).upload(name, body, { contentType, cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from(folder).getPublicUrl(name).data.publicUrl;
}

export type PhotoLocation = { store: 'cloudflare' | 'supabase'; folder: PhotoFolder; name: string };

const SUPABASE_PUBLIC_PATH = '/storage/v1/object/public/';

function locate(store: PhotoLocation['store'], rest: string): PhotoLocation | null {
  let path: string;
  try {
    path = decodeURIComponent(rest.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  const slash = path.indexOf('/');
  if (slash === -1) return null;
  const folder = path.slice(0, slash) as PhotoFolder;
  const name = path.slice(slash + 1);
  if (!PHOTO_FOLDERS.includes(folder) || !name || name.includes('/') || name.includes('..')) return null;
  return { store, folder, name };
}

/**
 * Which store, folder and file a photo link points at; null for any other link
 * (old seed photos came from Unsplash).
 */
export function photoLocation(url: string): PhotoLocation | null {
  const r2 = r2Config();
  if (r2 && url.startsWith(`${r2.photosUrl}/`)) return locate('cloudflare', url.slice(r2.photosUrl.length + 1));
  const at = url.indexOf(SUPABASE_PUBLIC_PATH);
  return at === -1 ? null : locate('supabase', url.slice(at + SUPABASE_PUBLIC_PATH.length));
}

/** The Cloudflare link for a photo that is still linked on Supabase. */
export function cloudflarePhotoUrl(location: PhotoLocation): string | null {
  const r2 = r2Config();
  return r2 ? photoUrl(r2.photosUrl, location.folder, location.name) : null;
}

/**
 * Removes photos by link, from whichever store holds them, and the R2 copy of
 * one still linked on Supabase. Best effort: a photo left behind costs a
 * little storage, never a failed delete.
 */
export async function deletePhotos(urls: string[]): Promise<void> {
  const r2 = r2Config();
  const onSupabase = new Map<PhotoFolder, string[]>();
  for (const url of urls) {
    const at = photoLocation(url);
    if (!at) continue;
    if (at.store === 'supabase') onSupabase.set(at.folder, [...(onSupabase.get(at.folder) ?? []), at.name]);
    if (r2) {
      await r2Delete(r2.photosBucket, `${at.folder}/${at.name}`).catch((error) =>
        console.error('Could not remove a photo from Cloudflare', error)
      );
    }
  }
  for (const [folder, names] of onSupabase) {
    const { error } = await supabase.storage.from(folder).remove(names);
    if (error) console.error('Could not remove photos from Supabase', error);
  }
}

export type SupabaseFile = { path: string; size: number; mimetype: string; createdAt: string };

const LIST_PAGE = 1000;

/** Every file in a Supabase bucket, one folder level deep (agreements sit in a folder per agreement). */
export async function listSupabaseFiles(bucket: string): Promise<SupabaseFile[]> {
  const files: SupabaseFile[] = [];
  const walk = async (folder: string, depth: number) => {
    for (let offset = 0; ; offset += LIST_PAGE) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, { limit: LIST_PAGE, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      for (const entry of data ?? []) {
        const path = folder ? `${folder}/${entry.name}` : entry.name;
        // Folders come back with no id.
        if (!entry.id) {
          if (depth < 2) await walk(path, depth + 1);
          continue;
        }
        const metadata = (entry.metadata ?? {}) as { size?: unknown; mimetype?: unknown };
        files.push({
          path,
          size: typeof metadata.size === 'number' ? metadata.size : 0,
          mimetype: typeof metadata.mimetype === 'string' ? metadata.mimetype : 'application/octet-stream',
          createdAt: entry.created_at ?? ''
        });
      }
      if (!data || data.length < LIST_PAGE) break;
    }
  };
  await walk('', 0);
  return files;
}

/** Where the original upload times of moved photos are kept: R2 would otherwise date them all to the move. */
export function photoDatesKey(folder: PhotoFolder): string {
  return `meta/${folder}-dates.json`;
}

export async function readPhotoDates(folder: PhotoFolder): Promise<Record<string, string>> {
  const r2 = r2Config();
  if (!r2) return {};
  const bytes = await r2Get(r2.privateBucket, photoDatesKey(folder));
  if (!bytes) return {};
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export type StoredPhoto = { name: string; uploadedAt: string };

/** Every photo in a folder, with when it was first uploaded, from both stores. */
export async function listPhotos(folder: PhotoFolder): Promise<StoredPhoto[]> {
  const byName = new Map<string, string>();
  const r2 = r2Config();
  if (r2) {
    const [objects, dates] = await Promise.all([r2List(r2.photosBucket, `${folder}/`), readPhotoDates(folder)]);
    for (const object of objects) {
      const name = object.key.slice(folder.length + 1);
      if (name && !name.includes('/')) byName.set(name, dates[name] ?? object.lastModified);
    }
  }
  for (const file of await listSupabaseFiles(folder)) {
    if (!file.path.includes('/') && file.createdAt) byName.set(file.path, file.createdAt);
  }
  return [...byName].map(([name, uploadedAt]) => ({ name, uploadedAt }));
}

/** Saves a private file: a signature or a signed copy of the agreement. */
export async function savePrivateFile(folder: PrivateFolder, path: string, body: Uint8Array, contentType: string): Promise<void> {
  const r2 = r2Config();
  if (r2) {
    await r2Put(r2.privateBucket, `${folder}/${path}`, body, contentType);
    return;
  }
  const { error } = await supabase.storage.from(folder).upload(path, body, { contentType, upsert: false });
  if (error) throw error;
}

/** A private file's bytes, from Cloudflare or, if it hasn't moved yet, Supabase. */
export async function readPrivateFile(folder: PrivateFolder, path: string): Promise<Uint8Array> {
  const r2 = r2Config();
  if (r2) {
    const bytes = await r2Get(r2.privateBucket, `${folder}/${path}`);
    if (bytes) return bytes;
  }
  const { data, error } = await supabase.storage.from(folder).download(path);
  if (error) throw error;
  return new Uint8Array(await data.arrayBuffer());
}

/** A link that opens a private file for a while, for the admin only. Null when it can't be made. */
export async function privateFileUrl(
  folder: PrivateFolder,
  path: string,
  expiresSeconds: number,
  downloadName?: string
): Promise<string | null> {
  const r2 = r2Config();
  try {
    if (r2 && (await r2Exists(r2.privateBucket, `${folder}/${path}`))) {
      return await r2SignedUrl(r2.privateBucket, `${folder}/${path}`, expiresSeconds, downloadName);
    }
  } catch (error) {
    console.error('Could not sign the Cloudflare file link', error);
  }
  const { data, error } = await supabase.storage
    .from(folder)
    .createSignedUrl(path, expiresSeconds, downloadName ? { download: downloadName } : undefined);
  if (error) {
    console.error('Could not sign the file link', error);
    return null;
  }
  return data.signedUrl;
}

/** Removes every private file in a folder (an agreement's), from both stores. */
export async function deletePrivateFolder(folder: PrivateFolder, subfolder: string): Promise<void> {
  const r2 = r2Config();
  if (r2) {
    for (const object of await r2List(r2.privateBucket, `${folder}/${subfolder}/`)) {
      await r2Delete(r2.privateBucket, object.key);
    }
  }
  const { data, error } = await supabase.storage.from(folder).list(subfolder);
  if (error) throw error;
  const paths = (data ?? []).filter((file) => file.id).map((file) => `${subfolder}/${file.name}`);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(folder).remove(paths);
    if (removeError) throw removeError;
  }
}
