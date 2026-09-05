import { NextResponse } from 'next/server';
import { getCompoundBySlug, readPublicPlaces } from '@/lib/directory-store';
import { serializePlace } from '@/lib/serialize-place';

export const dynamic = 'force-dynamic';

/**
 * PUBLIC TIER ONLY.
 *
 * This route must never return vetted rows, whatever the query string says -- it
 * takes no tier parameter at all, and the store method it calls filters on
 * tier = 'public' in the query itself. Vetted places are reachable only by POSTing
 * a valid code to /api/unlock. Do not add a tier or "include" parameter here.
 */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const compound = await getCompoundBySlug(params.slug);
    if (!compound || !compound.active) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }
    const places = await readPublicPlaces(compound.id);
    return NextResponse.json({
      compound: { slug: compound.slug, name_en: compound.nameEn, name_ar: compound.nameAr },
      places: places.map(serializePlace)
    });
  } catch (error) {
    console.error('Failed to read places', error);
    return NextResponse.json({ error: 'Could not load places.' }, { status: 500 });
  }
}
