import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deletePlace, updatePlace, type PlaceInput } from '@/lib/directory-store';
import { isPlaceCategory, isPlaceTier } from '@/lib/directory-taxonomy';
import { cleanPhone, whatsappFor } from '@/lib/phone';

export const dynamic = 'force-dynamic';

/** Checked before the database sees it: a malformed id is a 400, not a Postgres 22P02 and a 500. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notFound = () => NextResponse.json({ error: 'That entry no longer exists.' }, { status: 404 });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!UUID.test(params.id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
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
    }
  }
  if (value.phone !== undefined) {
    // Digits only (a leading + kept), and null rather than '' when cleared.
    const cleaned = typeof value.phone === 'string' ? cleanPhone(value.phone) : '';
    patch.phone = cleaned.replace(/^\+/, '').length > 0 ? cleaned : null;
  }
  if (value.whatsapp !== undefined) {
    // Same rule as creating: a landline or hotline is stored as no WhatsApp at all.
    patch.whatsapp = typeof value.whatsapp === 'string' ? whatsappFor(value.whatsapp) : null;
  }
  if (value.address !== undefined) {
    const item = value.address as string | null;
    patch.address = item && item.trim().length > 0 ? item.trim() : null;
  }
  for (const key of ['lat', 'lng'] as const) {
    if (value[key] !== undefined) {
      const item = value[key];
      if (item !== null && (typeof item !== 'number' || !Number.isFinite(item))) {
        return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
      }
      patch[key] = item as number | null;
    }
  }
  if (value.sortOrder !== undefined) {
    if (typeof value.sortOrder !== 'number' || !Number.isInteger(value.sortOrder)) {
      return NextResponse.json({ error: 'Invalid sort order.' }, { status: 400 });
    }
    patch.sortOrder = value.sortOrder;
  }
  if (value.active !== undefined) {
    // Strict: Boolean('false') is true, which would un-hide a place meant to be hidden.
    if (typeof value.active !== 'boolean') return NextResponse.json({ error: 'Invalid field.' }, { status: 400 });
    patch.active = value.active;
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });

  try {
    const place = await updatePlace(params.id, patch);
    // Null when no row has this id: deleted in another tab, typically.
    if (!place) return notFound();
    return NextResponse.json({ place });
  } catch (error) {
    console.error('Failed to update place', error);
    return NextResponse.json({ error: 'Could not save this entry.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!UUID.test(params.id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  try {
    // False when no row had this id: a success here would be a false "done".
    if (!(await deletePlace(params.id))) return notFound();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete place', error);
    return NextResponse.json({ error: 'Could not delete this entry.' }, { status: 500 });
  }
}
