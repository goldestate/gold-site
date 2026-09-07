import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { readCompounds } from '@/lib/directory-store';
import { readProperties } from '@/lib/properties-store';
import { deriveCompoundSuggestions } from '@/lib/compound-suggestions';

export const dynamic = 'force-dynamic';

/**
 * Compounds visible in the listings that the directory does not have yet.
 *
 * Admin only, and read only -- it never writes to properties. Unpublished
 * listings count: staff entered them, and a compound is a real place whether or
 * not its unit is currently on the site.
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const [properties, compounds] = await Promise.all([readProperties(), readCompounds(true)]);
    const existing = new Set(compounds.map((item) => item.slug));
    return NextResponse.json({ suggestions: deriveCompoundSuggestions(properties, existing) });
  } catch (error) {
    console.error('Failed to derive compound suggestions', error);
    return NextResponse.json({ error: 'Could not read the listings.' }, { status: 500 });
  }
}
