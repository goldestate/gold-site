import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createPlaces, readAllPlaces, type PlaceInput } from '@/lib/directory-store';
import { isPlaceCategory, isPlaceTier } from '@/lib/directory-taxonomy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const compoundId = request.nextUrl.searchParams.get('compoundId');
  if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });
  try {
    return NextResponse.json({ places: await readAllPlaces(compoundId) });
  } catch (error) {
    console.error('Failed to read places', error);
    return NextResponse.json({ error: 'Could not load places.' }, { status: 500 });
  }
}

function toPlaceInput(raw: unknown, compoundId: string): PlaceInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const nameEn = typeof value.nameEn === 'string' ? value.nameEn.trim() : '';
  if (!nameEn || !isPlaceCategory(value.category) || !isPlaceTier(value.tier)) return null;
  const optional = (key: string) => {
    const item = value[key];
    return typeof item === 'string' && item.trim().length > 0 ? item.trim() : null;
  };
  return {
    compoundId,
    category: value.category,
    nameEn,
    nameAr: typeof value.nameAr === 'string' ? value.nameAr.trim() : '',
    phone: optional('phone'),
    whatsapp: optional('whatsapp'),
    address: optional('address'),
    lat: typeof value.lat === 'number' && Number.isFinite(value.lat) ? value.lat : null,
    lng: typeof value.lng === 'number' && Number.isFinite(value.lng) ? value.lng : null,
    tier: value.tier,
    notesEn: typeof value.notesEn === 'string' ? value.notesEn.trim() : '',
    notesAr: typeof value.notesAr === 'string' ? value.notesAr.trim() : '',
    sortOrder: typeof value.sortOrder === 'number' && Number.isFinite(value.sortOrder) ? value.sortOrder : 0,
    active: value.active === undefined ? true : Boolean(value.active)
  };
}

/** Accepts one place or many, so the paste importer commits its whole preview at once. */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const value = (body ?? {}) as Record<string, unknown>;
  const compoundId = typeof value.compoundId === 'string' ? value.compoundId : '';
  if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });

  const rawPlaces = Array.isArray(value.places) ? value.places : [value.place];
  const inputs: PlaceInput[] = [];
  for (const raw of rawPlaces) {
    const parsed = toPlaceInput(raw, compoundId);
    if (!parsed) return NextResponse.json({ error: 'One or more entries are invalid.' }, { status: 400 });
    inputs.push(parsed);
  }
  if (inputs.length === 0) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });

  try {
    return NextResponse.json({ places: await createPlaces(inputs) }, { status: 201 });
  } catch (error) {
    console.error('Failed to create places', error);
    return NextResponse.json({ error: 'Could not save these entries.' }, { status: 500 });
  }
}
