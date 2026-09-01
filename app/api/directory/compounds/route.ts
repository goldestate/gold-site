import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createCompound, readAllPlaces, readActiveCode, readCompounds } from '@/lib/directory-store';
import { isLocation } from '@/lib/property-taxonomy';
import { PLACE_CATEGORIES, slugifyCompound } from '@/lib/directory-taxonomy';

export const dynamic = 'force-dynamic';

/** Admin list: every compound with its code, redemption count, and completeness. */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const compounds = await readCompounds(true);
    const rows = await Promise.all(
      compounds.map(async (compound) => {
        const [places, code] = await Promise.all([readAllPlaces(compound.id), readActiveCode(compound.id)]);
        const filled = new Set(places.filter((place) => place.active).map((place) => place.category));
        return {
          ...compound,
          placeCount: places.length,
          filledCategories: filled.size,
          totalCategories: PLACE_CATEGORIES.length,
          missingCategories: PLACE_CATEGORIES.filter((item) => !filled.has(item.value)).map((item) => item.value),
          code: code?.code ?? null,
          redemptionCount: code?.redemptionCount ?? 0
        };
      })
    );
    return NextResponse.json({ compounds: rows });
  } catch (error) {
    console.error('Failed to read compounds', error);
    return NextResponse.json({ error: 'Could not load compounds.' }, { status: 500 });
  }
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
  const value = (body ?? {}) as Record<string, unknown>;
  const nameEn = typeof value.nameEn === 'string' ? value.nameEn.trim() : '';
  const nameAr = typeof value.nameAr === 'string' ? value.nameAr.trim() : '';
  const matchNames = Array.isArray(value.matchNames)
    ? value.matchNames.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  if (!nameEn || !isLocation(value.location)) {
    return NextResponse.json({ error: 'Name and location are required.' }, { status: 400 });
  }

  try {
    const compound = await createCompound({
      slug: typeof value.slug === 'string' && value.slug.trim() ? slugifyCompound(value.slug) : slugifyCompound(nameEn),
      nameEn,
      nameAr: nameAr || nameEn,
      location: value.location,
      // Default the mapping to the compound's own name so listings match immediately.
      matchNames: matchNames.length > 0 ? matchNames : [nameEn]
    });
    return NextResponse.json({ compound }, { status: 201 });
  } catch (error) {
    console.error('Failed to create compound', error);
    return NextResponse.json({ error: 'Could not create this compound.' }, { status: 500 });
  }
}
