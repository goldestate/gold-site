import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deleteProperty, updateProperty, type PropertyInput } from '@/lib/properties-store';
import { isLocation, isPropertyType, isUnitType } from '@/lib/property-taxonomy';

function pickPatch(body: unknown): Partial<PropertyInput> | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  const patch: Partial<PropertyInput> = {};

  if (value.name !== undefined) {
    if (typeof value.name !== 'string' || value.name.trim().length === 0) return null;
    patch.name = value.name.trim();
  }
  if (value.location !== undefined) {
    if (!isLocation(value.location)) return null;
    patch.location = value.location;
  }
  if (value.propertyType !== undefined) {
    if (!isPropertyType(value.propertyType)) return null;
    patch.propertyType = value.propertyType;
  }
  if (value.unitType !== undefined) {
    if (!isUnitType(value.unitType)) return null;
    patch.unitType = value.unitType;
  }
  if (value.price !== undefined) {
    if (typeof value.price !== 'number' || !Number.isFinite(value.price) || value.price < 0) return null;
    patch.price = value.price;
  }
  if (value.image !== undefined) {
    if (typeof value.image !== 'string' || value.image.trim().length === 0) return null;
    patch.image = value.image.trim();
  }
  if (value.tone !== undefined) {
    if (value.tone !== 'color' && value.tone !== 'mono') return null;
    patch.tone = value.tone;
  }
  if (value.published !== undefined) {
    if (typeof value.published !== 'boolean') return null;
    patch.published = value.published;
  }

  return patch;
}

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

  const patch = pickPatch(body);
  if (!patch) {
    return NextResponse.json({ error: 'Invalid fields.' }, { status: 400 });
  }

  const property = await updateProperty(params.id, patch);
  if (!property) {
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }

  return NextResponse.json({ property });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const deleted = await deleteProperty(params.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
