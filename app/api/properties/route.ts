import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createProperty, readProperties, readPublishedProperties, type PropertyInput } from '@/lib/properties-store';
import { isLocation, isPropertyType, isUnitType } from '@/lib/property-taxonomy';

function isValidInput(body: unknown): body is PropertyInput {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  return (
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isLocation(value.location) &&
    isPropertyType(value.propertyType) &&
    isUnitType(value.unitType) &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    value.price >= 0 &&
    typeof value.image === 'string' &&
    value.image.trim().length > 0 &&
    (value.tone === 'color' || value.tone === 'mono') &&
    typeof value.published === 'boolean'
  );
}

export async function GET(request: NextRequest) {
  const isAdmin = await requireAdmin(request);
  const properties = isAdmin ? await readProperties() : await readPublishedProperties();
  return NextResponse.json({ properties });
}

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

  if (!isValidInput(body)) {
    return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
  }

  const property = await createProperty({
    name: body.name.trim(),
    location: body.location,
    propertyType: body.propertyType,
    unitType: body.unitType,
    price: body.price,
    image: body.image.trim(),
    tone: body.tone,
    published: body.published
  });

  return NextResponse.json({ property }, { status: 201 });
}
