import { promises as fs } from 'fs';
import path from 'path';

export type Property = {
  id: string;
  name: string;
  location: string;
  priceMin: number;
  priceMax: number | null;
  image: string;
  tone: 'color' | 'mono';
  published: boolean;
  createdAt: string;
};

export type PropertyInput = {
  name: string;
  location: string;
  priceMin: number;
  priceMax: number | null;
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
    location: 'New Cairo, Egypt',
    priceMin: 18_000_000,
    priceMax: 26_000_000,
    image:
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80',
    tone: 'color',
    published: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'seed-atelier',
    name: 'The Atelier House',
    location: '5th Settlement, Egypt',
    priceMin: 9_000_000,
    priceMax: 14_000_000,
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
    tone: 'mono',
    published: true,
    createdAt: '2026-01-02T00:00:00.000Z'
  },
  {
    id: 'seed-palm-court',
    name: 'Palm Court Villas',
    location: 'North Coast, Egypt',
    priceMin: 24_000_000,
    priceMax: 42_000_000,
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

async function loadAll(): Promise<Property[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw) as Property[];
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
