import { NextResponse } from 'next/server';
import { readCompounds } from '@/lib/directory-store';

export const dynamic = 'force-dynamic';

// Without a Cache-Control header, a cache in between may keep this heuristically,
// and a compound that was switched off would keep being offered.
const NO_STORE = { 'Cache-Control': 'no-store' };

/** Public. Lists active compounds so a client can pick one; contains no place data. */
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
          match_names: item.matchNames
        }))
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('Failed to read compounds', error);
    return NextResponse.json({ error: 'Could not load compounds.' }, { status: 500, headers: NO_STORE });
  }
}
