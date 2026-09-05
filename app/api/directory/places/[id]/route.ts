import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deletePlace, updatePlace, type PlaceInput } from '@/lib/directory-store';
import { isPlaceCategory, isPlaceTier } from '@/lib/directory-taxonomy';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
  const patch: Partial<PlaceInput> = {};

  if (value.category !== undefined) {
    if (!isPlaceCategory(value.category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    patch.category = value.category;
  }
  if (value.tier !== undefined) {
    if (!isPlaceTier(value.tier)) return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 });
    patch.tier = value.tier;
  }
  if (value.nameEn !== undefined) {
    if (typeof value.nameEn !== 'string' || !value.nameEn.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    patch.nameEn = value.nameEn.trim();
  }
  for (const key of ['nameAr', 'notesEn', 'notesAr'] as const) {
    if (value[key] !== undefined) {
      if (typeof value[key] !== 'string') return NextResponse.json({ error: 'Invalid field.' }, { status: 400 });
      patch[key] = (value[key] as string).trim();
    }
  }
  for (const key of ['phone', 'whatsapp', 'address'] as const) {
    if (value[key] !== undefined) {
      if (value[key] !== null && typeof value[key] !== 'string') {
        return NextResponse.json({ error: 'Invalid field.' }, { status: 400 });
      }
      const item = value[key] as string | null;
      patch[key] = item && item.trim().length > 0 ? item.trim() : null;
    }
  }
  if (value.sortOrder !== undefined) {
    if (typeof value.sortOrder !== 'number' || !Number.isFinite(value.sortOrder)) {
      return NextResponse.json({ error: 'Invalid sort order.' }, { status: 400 });
    }
    patch.sortOrder = value.sortOrder;
  }
  if (value.active !== undefined) patch.active = Boolean(value.active);

  try {
    return NextResponse.json({ place: await updatePlace(params.id, patch) });
  } catch (error) {
    console.error('Failed to update place', error);
    return NextResponse.json({ error: 'Could not save this entry.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    await deletePlace(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete place', error);
    return NextResponse.json({ error: 'Could not delete this entry.' }, { status: 500 });
  }
}
