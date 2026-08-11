import { promises as fs } from 'fs';
import path from 'path';
import {
  isPropertyType,
  isUnitType,
  normalizeLegacyLocation,
  type LocationValue,
  type PropertyTypeValue,
  type UnitTypeValue
} from './property-taxonomy';

export type Property = {
  id: string;
  name: string;
  location: LocationValue;
  propertyType: PropertyTypeValue;
  unitType: UnitTypeValue;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  image: string;
  tone: 'color' | 'mono';
  published: boolean;
  createdAt: string;
};

export type PropertyInput = {
  name: string;
  location: LocationValue;
  propertyType: PropertyTypeValue;
  unitType: UnitTypeValue;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  image: string;
  tone: 'color' | 'mono';
  published: boolean;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'properties.json');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'seed-observatory',
    name: 'The Observatory Residence',
    location: 'new-cairo',
    propertyType: 'primary',
    unitType: 'apartment',
    price: 18_000_000,
    bedrooms: 3,
    bathrooms: 3,
    area: 210,
    description:
      'A refined apartment residence overlooking New Cairo, finished to a premium standard with private balconies and dedicated concierge service.',
    image:
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80',
    tone: 'color',
    published: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'seed-atelier',
    name: 'The Atelier House',
    location: 'new-cairo',
    propertyType: 'resale',
    unitType: 'townhouse',
    price: 9_000_000,
    bedrooms: 4,
    bathrooms: 4,
    area: 260,
    description:
      'A resale townhouse with a private garden and flexible layout, ready to move in within one of New Cairo’s most established communities.',
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
    tone: 'mono',
    published: true,
    createdAt: '2026-01-02T00:00:00.000Z'
  },
  {
    id: 'seed-palm-court',
    name: 'Palm Court Villas',
    location: 'north-coast',
    propertyType: 'primary',
    unitType: 'villa',
    price: 24_000_000,
    bedrooms: 5,
    bathrooms: 5,
    area: 380,
    description:
      'A beachside villa with direct sea views, a private pool, and landscaped grounds designed for year-round coastal living.',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
    tone: 'color',
    published: true,
    createdAt: '2026-01-03T00:00:00.000Z'
  }
];

let writeQueue: Promise<unknown> = Promise.resolve();

function withQueue<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function ensureDataFile() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_PROPERTIES, null, 2));
  }
}

/**
 * Older records (created before the type/unit/location taxonomy existed)
 * may be missing these fields or store location as free text. Normalize
 * on read so nothing breaks; saving the record again through the admin
 * form persists the corrected values.
 */
function normalizeRecord(raw: Record<string, unknown>): Property {
  const legacyPrice = typeof raw.priceMin === 'number' ? raw.priceMin : 0;
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    location: normalizeLegacyLocation(raw.location),
    propertyType: isPropertyType(raw.propertyType) ? raw.propertyType : 'resale',
    unitType: isUnitType(raw.unitType) ? raw.unitType : 'apartment',
    price: typeof raw.price === 'number' ? raw.price : legacyPrice,
    bedrooms: typeof raw.bedrooms === 'number' ? raw.bedrooms : 0,
    bathrooms: typeof raw.bathrooms === 'number' ? raw.bathrooms : 0,
    area: typeof raw.area === 'number' ? raw.area : 0,
    description: typeof raw.description === 'string' ? raw.description : '',
    image: String(raw.image ?? ''),
    tone: raw.tone === 'mono' ? 'mono' : 'color',
    published: Boolean(raw.published),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString()
  };
}

async function loadAll(): Promise<Property[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return parsed.map(normalizeRecord);
  } catch {
    return [];
  }
}

async function saveAll(list: Property[]) {
  const tmpFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(list, null, 2));
  await fs.rename(tmpFile, DATA_FILE);
}

export async function readProperties(): Promise<Property[]> {
  const list = await loadAll();
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readPublishedProperties(): Promise<Property[]> {
  const list = await readProperties();
  return list.filter((item) => item.published);
}

export async function getProperty(id: string): Promise<Property | null> {
  const list = await loadAll();
  return list.find((item) => item.id === id) ?? null;
}

export function createProperty(input: PropertyInput): Promise<Property> {
  return withQueue(async () => {
    const list = await loadAll();
    const property: Property = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    list.push(property);
    await saveAll(list);
    return property;
  });
}

export function updateProperty(
  id: string,
  patch: Partial<PropertyInput>
): Promise<Property | null> {
  return withQueue(async () => {
    const list = await loadAll();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...patch };
    await saveAll(list);
    return list[index];
  });
}

export function deleteProperty(id: string): Promise<boolean> {
  return withQueue(async () => {
    const list = await loadAll();
    const next = list.filter((item) => item.id !== id);
    if (next.length === list.length) return false;
    await saveAll(next);
    return true;
  });
}
