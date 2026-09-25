import { NextResponse } from 'next/server';
import { readCompounds } from '@/lib/directory-store';

export const dynamic = 'force-dynamic';

// Without a Cache-Control header, a cache in between may keep this heuristically,
// and a compound that was switched off would keep being offered.
const NO_STORE = { 'Cache-Control': 'no-store' };

/** Public. Lists active compounds, with their pins; contains no place data. */
export async function GET() {
  try {
    const compounds = await readCompounds();
    return NextResponse.json(
      {
        compounds: compounds.map((item) => ({
          slug: item.slug,
          name_en: item.nameEn,
          name_ar: item.nameAr,
          location: item.location,
          // Listing names that belong to this compound ("Marassi Marina" is
          // Marassi). The app in the App Store decodes this field, so it stays,
          // but nothing in the app matches listings with it any more; the admin's
          // compound suggestions read the same names from the store instead.
          match_names: item.matchNames,
          // Where it is, for the app to find the compound a guest is standing in.
          // The matching happens on the phone, against this list, so the guest's
          // location is never sent here. Null until staff pin it; the App Store
          // app before this release ignores all three.
          lat: item.pin?.lat ?? null,
          lng: item.pin?.lng ?? null,
          radius_km: item.radiusKm
        }))
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('Failed to read compounds', error);
    return NextResponse.json({ error: 'Could not load compounds.' }, { status: 500, headers: NO_STORE });
  }
}
