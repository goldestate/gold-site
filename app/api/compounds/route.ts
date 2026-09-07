import { NextResponse } from 'next/server';
import { readCompounds } from '@/lib/directory-store';

export const dynamic = 'force-dynamic';

/** Public. Lists active compounds so a client can pick one; contains no place data. */
export async function GET() {
  try {
    const compounds = await readCompounds();
    return NextResponse.json({
      compounds: compounds.map((item) => ({
        slug: item.slug,
        name_en: item.nameEn,
        name_ar: item.nameAr,
        location: item.location,
        // The app resolves a listing's compound name against these. Without
        // them it can only match a listing whose name is already the compound's
        // own, so "Marassi Marina" would find nothing.
        match_names: item.matchNames
      }))
    });
  } catch (error) {
    console.error('Failed to read compounds', error);
    return NextResponse.json({ error: 'Could not load compounds.' }, { status: 500 });
  }
}
