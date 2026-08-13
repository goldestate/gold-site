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
    typeof value.bedrooms === 'number' &&
    Number.isFinite(value.bedrooms) &&
    value.bedrooms >= 0 &&
    typeof value.bathrooms === 'number' &&
    Number.isFinite(value.bathrooms) &&
    value.bathrooms >= 0 &&
    typeof value.area === 'number' &&
    Number.isFinite(value.area) &&
    value.area >= 0 &&
    typeof value.description === 'string' &&
    Array.isArray(value.images) &&
    value.images.length > 0 &&
    value.images.every((item) => typeof item === 'string' && item.trim().length > 0) &&
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

  try {
    const property = await createProperty({
      name: body.name.trim(),
      location: body.location,
      propertyType: body.propertyType,
      unitType: body.unitType,
      price: body.price,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      area: body.area,
      description: body.description.trim(),
      images: body.images.map((url) => url.trim()),
      tone: body.tone,
      published: body.published
    });
    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Failed to create property', error);
    return NextResponse.json({ error: 'Could not save this property. Please try again.' }, { status: 500 });
  }
}
