import { AwsClient } from 'aws4fetch';

/**
 * Server-only. Cloudflare R2, through its S3-compatible API.
 *
 *   R2_ACCOUNT_ID         the Cloudflare account the buckets belong to
 *   R2_ACCESS_KEY_ID      an R2 API token's access key, with Object Read & Write
 *   R2_SECRET_ACCESS_KEY  that token's secret
 *   R2_PHOTOS_BUCKET      public bucket: listing photos, served at R2_PHOTOS_URL
 *   R2_PRIVATE_BUCKET     private bucket: signed agreements and database backups
 *   R2_PHOTOS_URL         the photos bucket's custom domain, e.g. https://photos.gold-eg.com
 *
 * Until all six are set, nothing here is used and files stay on Supabase.
 * R2_ENDPOINT is for local testing only: it replaces the account's endpoint.
 */

export type R2Config = {
  accountId: string;
  photosBucket: string;
  privateBucket: string;
  photosUrl: string;
  endpoint: string;
};

let cached: { config: R2Config; client: AwsClient } | null | undefined;

function setup(): { config: R2Config; client: AwsClient } | null {
  if (cached !== undefined) return cached;
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const photosBucket = process.env.R2_PHOTOS_BUCKET?.trim();
  const privateBucket = process.env.R2_PRIVATE_BUCKET?.trim();
  const photosUrl = process.env.R2_PHOTOS_URL?.trim().replace(/\/+$/, '');
  if (!accountId || !accessKeyId || !secretAccessKey || !photosBucket || !privateBucket || !photosUrl) {
    cached = null;
    return cached;
  }
  const endpoint = (process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`).replace(/\/+$/, '');
  cached = {
    config: { accountId, photosBucket, privateBucket, photosUrl, endpoint },
    client: new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })
  };
  return cached;
}

/** The buckets, or null while R2 isn't set up. */
export function r2Config(): R2Config | null {
  return setup()?.config ?? null;
}

function client(): { config: R2Config; client: AwsClient } {
  const ready = setup();
  if (!ready) throw new Error('Cloudflare R2 is not configured.');
  return ready;
}

function objectUrl(bucket: string, key: string): string {
  const { config } = client();
  return `${config.endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

async function failure(action: string, res: Response): Promise<Error> {
  const detail = await res.text().catch(() => '');
  return new Error(`R2 ${action} failed (${res.status}): ${detail.slice(0, 300)}`);
}

export async function r2Put(
  bucket: string,
  key: string,
  body: Uint8Array,
  contentType: string,
  cacheControl?: string
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': contentType };
  if (cacheControl) headers['Cache-Control'] = cacheControl;
  // Node's fetch takes bytes as they are; the DOM typings don't list Uint8Array.
  const res = await client().client.fetch(objectUrl(bucket, key), { method: 'PUT', body: body as unknown as BodyInit, headers });
  if (!res.ok) throw await failure(`upload of ${key}`, res);
}

/** The object's bytes, or null when there is no such object. */
export async function r2Get(bucket: string, key: string): Promise<Uint8Array | null> {
  const res = await client().client.fetch(objectUrl(bucket, key));
  if (res.status === 404) return null;
  if (!res.ok) throw await failure(`download of ${key}`, res);
  return new Uint8Array(await res.arrayBuffer());
}

export async function r2Exists(bucket: string, key: string): Promise<boolean> {
  const res = await client().client.fetch(objectUrl(bucket, key), { method: 'HEAD' });
  if (res.status === 404) return false;
  if (!res.ok) throw await failure(`check of ${key}`, res);
  return true;
}

/** Deleting something that isn't there counts as done. */
export async function r2Delete(bucket: string, key: string): Promise<void> {
  const res = await client().client.fetch(objectUrl(bucket, key), { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw await failure(`delete of ${key}`, res);
}

export type R2Object = { key: string; size: number; lastModified: string };

function xmlText(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function tag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? xmlText(match[1]) : null;
}

/** Every object whose key starts with the prefix, however many pages that takes. */
export async function r2List(bucket: string, prefix: string): Promise<R2Object[]> {
  const { config, client: aws } = client();
  const objects: R2Object[] = [];
  let token: string | null = null;
  // 1,000 per page: a ceiling of 200,000 objects, far past anything GOLD stores.
  for (let page = 0; page < 200; page += 1) {
    const url = new URL(`${config.endpoint}/${bucket}`);
    url.searchParams.set('list-type', '2');
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('max-keys', '1000');
    if (token) url.searchParams.set('continuation-token', token);
    const res = await aws.fetch(url.toString());
    if (!res.ok) throw await failure(`listing of ${prefix}`, res);
    const xml = await res.text();
    for (const match of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = tag(match[1], 'Key');
      if (!key) continue;
      objects.push({
        key,
        size: Number(tag(match[1], 'Size') ?? 0),
        lastModified: tag(match[1], 'LastModified') ?? ''
      });
    }
    token = tag(xml, 'IsTruncated') === 'true' ? tag(xml, 'NextContinuationToken') : null;
    if (!token) break;
  }
  return objects;
}

/**
 * A link that opens one private object for a while, without the keys. With a
 * download name, the browser saves it under that name instead of showing it.
 */
export async function r2SignedUrl(
  bucket: string,
  key: string,
  expiresSeconds: number,
  downloadName?: string
): Promise<string> {
  const url = new URL(objectUrl(bucket, key));
  url.searchParams.set('X-Amz-Expires', String(expiresSeconds));
  if (downloadName) {
    const ascii = downloadName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    url.searchParams.set(
      'response-content-disposition',
      `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    );
  }
  const signed = await client().client.sign(url.toString(), { method: 'GET', aws: { signQuery: true } });
  return signed.url;
}
