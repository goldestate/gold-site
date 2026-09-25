import type { LocationValue } from './property-taxonomy';
import { REGION_BOXES, isInBox, isValidPin, type Box, type Pin } from './map-pin';

/**
 * Finds a compound on OpenStreetMap by its name, so nobody has to pin it by hand.
 *
 * Server-only. Nominatim, OpenStreetMap's search, is free with conditions: an
 * identifying User-Agent, at most one request a second, and results cached
 * rather than asked for again -- the pin is stored on the compound, so each one
 * is looked up about once.
 *
 * It would rather find nothing than the wrong place. A result counts only if it
 * sits inside the compound's region, is the kind of thing a compound can be (not
 * a restaurant, a road or a golf fairway that shares the name), and is named for
 * it word for word. Tested against GOLD's compounds, the loose version pinned
 * "D bay" on Hacienda Bay and "Lake View" on a restaurant in Madinaty; these
 * rules turn both into "not found", which the app then tries on Apple Maps.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'GOLD compound guide (https://gold-eg.com; gold.domain01@gmail.com)';
const MIN_GAP_MS = 1100;
const TIMEOUT_MS = 8000;

/** OpenStreetMap categories that are never a compound, whatever they are called. */
const NOT_A_COMPOUND = new Set([
  'amenity',
  'shop',
  'highway',
  'waterway',
  'natural',
  'office',
  'craft',
  'railway',
  'aeroway',
  'man_made',
  'emergency',
  'healthcare',
  'public_transport',
  'historic'
]);

type NominatimResult = {
  lat: string;
  lon: string;
  category?: string;
  name?: string;
  display_name?: string;
  namedetails?: Record<string, string> | null;
};

let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Every request to Nominatim goes through here, one at a time, a second apart. */
function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    try {
      return await task();
    } finally {
      lastRequestAt = Date.now();
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Lower case, accents off, split into Latin and Arabic words. */
function words(value: string): string[] {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9؀-ۿ]+/)
    .filter(Boolean);
}

/**
 * Whether a result is named for the compound: every word of the name appears in
 * it -- "Mountain View 1" in "Mountain View Sokhna 1" -- or, for longer names,
 * the whole name run together, since "Mountain View" is mapped as "Mountainview
 * Ras El Hekma". Short names must match word for word: "D bay" is not inside
 * "Hacienda Bay", but "dbay" run together nearly is.
 */
export function isNamedFor(compoundName: string, labels: string[]): boolean {
  const wanted = words(compoundName);
  if (wanted.length === 0) return false;
  const joined = wanted.join('');
  return labels.some((label) => {
    const have = words(label);
    if (wanted.every((word) => have.includes(word))) return true;
    return joined.length >= 8 && have.join('').includes(joined);
  });
}

async function search(query: string, box: Box): Promise<NominatimResult[]> {
  const [west, south, east, north] = box;
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '10',
    countrycodes: 'eg',
    namedetails: '1',
    'accept-language': 'en',
    // Only inside the region. Without it "Mountain View" is in New Cairo.
    viewbox: `${west},${north},${east},${south}`,
    bounded: '1'
  });
  return throttled(async () => {
    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { 'User-Agent': USER_AGENT, Referer: 'https://gold-eg.com' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`OpenStreetMap search answered ${res.status}`);
    const body = (await res.json()) as unknown;
    return Array.isArray(body) ? (body as NominatimResult[]) : [];
  });
}

/**
 * The compound's pin, or null when OpenStreetMap doesn't know it. Throws when
 * the search itself failed (offline, rate limited), which is not the same answer:
 * a compound that failed to look up is tried again later, one that isn't on the
 * map is left alone for a day.
 */
export async function findCompoundPin(compound: {
  nameEn: string;
  nameAr: string;
  location: LocationValue;
}): Promise<Pin | null> {
  const box = REGION_BOXES[compound.location];
  if (!box) return null;

  // The Arabic name is often the one on the map in Egypt, when there is one:
  // compounds added without it store the English name there too.
  const names = [compound.nameEn];
  if (compound.nameAr && compound.nameAr.trim() !== compound.nameEn.trim()) names.push(compound.nameAr);

  for (const name of names) {
    for (const result of await search(name, box)) {
      if (result.category && NOT_A_COMPOUND.has(result.category)) continue;
      const labels = [
        result.name ?? '',
        ...Object.values(result.namedetails ?? {}),
        (result.display_name ?? '').split(',')[0]
      ];
      if (!isNamedFor(name, labels)) continue;
      const pin = { lat: Number(result.lat), lng: Number(result.lon) };
      if (isValidPin(pin) && isInBox(pin, box)) return pin;
    }
  }
  return null;
}
