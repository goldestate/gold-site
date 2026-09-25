import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import {
  createCompound,
  deleteCompound,
  postgresErrorCode,
  updateCompound,
  type Compound
} from '@/lib/directory-store';
import { isLocation } from '@/lib/property-taxonomy';
import { slugifyCompound } from '@/lib/directory-taxonomy';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * There is no GET here: both directory pages read the store directly, and the
 * old admin list endpoint had no callers while repeating the page's counting.
 */

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return null;
  }
}

/**
 * Deduplicated case-insensitively: two spellings of the same name are one rule,
 * and a list that shows the same entry twice reads like a bug.
 */
function cleanMatchNames(raw: unknown[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    names.push(trimmed);
  }
  return names;
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const value = await readBody(request);
  if (!value) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const nameEn = typeof value.nameEn === 'string' ? value.nameEn.trim() : '';
  const nameAr = typeof value.nameAr === 'string' ? value.nameAr.trim() : '';
  const matchNames = Array.isArray(value.matchNames) ? cleanMatchNames(value.matchNames) : [];

  if (!nameEn) return NextResponse.json({ error: 'Give the compound an English name.' }, { status: 400 });
  if (!isLocation(value.location)) return NextResponse.json({ error: 'Pick a region.' }, { status: 400 });

  // The slug is built from Latin letters and digits only, so a name typed in
  // Arabic gives an empty one. Stored empty, the compound's admin link pointed
  // back at the list and it could never be opened.
  const slug = typeof value.slug === 'string' && value.slug.trim() ? slugifyCompound(value.slug) : slugifyCompound(nameEn);
  if (!slug) {
    return NextResponse.json(
      { error: 'Give the compound an English name. The Arabic name goes in the second box.' },
      { status: 400 }
    );
  }

  try {
    const compound = await createCompound({
      slug,
      nameEn,
      nameAr: nameAr || nameEn,
      location: value.location,
      // Default the mapping to the compound's own name so listings match immediately.
      matchNames: matchNames.length > 0 ? matchNames : [nameEn]
    });
    return NextResponse.json({ compound }, { status: 201 });
  } catch (error) {
    if (postgresErrorCode(error) === '23505') {
      return NextResponse.json(
        {
          error: `A compound called "${nameEn}" is already in the directory. Open it from the list, and add any other spelling to its match names there.`
        },
        { status: 409 }
      );
    }
    console.error('Failed to create compound', error);
    return NextResponse.json({ error: 'Could not add this compound. Try again.' }, { status: 500 });
  }
}

/**
 * Edits a compound: any of nameEn, nameAr, location, active and matchNames.
 * The editor's match-names box still sends just {id, matchNames}, and the
 * settings panel sends the rest. The slug never changes (see updateCompound).
 */
export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const value = await readBody(request);
  if (!value) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const id = typeof value.id === 'string' ? value.id : '';
  if (!UUID.test(id)) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const patch: Partial<Pick<Compound, 'nameEn' | 'nameAr' | 'location' | 'active' | 'matchNames'>> = {};

  if (value.nameEn !== undefined) {
    const nameEn = typeof value.nameEn === 'string' ? value.nameEn.trim() : '';
    if (!nameEn) return NextResponse.json({ error: 'Give the compound an English name.' }, { status: 400 });
    patch.nameEn = nameEn;
  }
  if (value.nameAr !== undefined) {
    if (typeof value.nameAr !== 'string') return NextResponse.json({ error: 'Invalid Arabic name.' }, { status: 400 });
    // name_ar is NOT NULL; an emptied box falls back to the English name, as on create.
    const nameAr = value.nameAr.trim();
    patch.nameAr = nameAr || patch.nameEn || undefined;
    if (!patch.nameAr) {
      return NextResponse.json({ error: 'Give the compound an Arabic name, or leave it as it was.' }, { status: 400 });
    }
  }
  if (value.location !== undefined) {
    if (!isLocation(value.location)) return NextResponse.json({ error: 'Pick a region.' }, { status: 400 });
    patch.location = value.location;
  }
  if (value.active !== undefined) {
    if (typeof value.active !== 'boolean') return NextResponse.json({ error: 'Invalid active flag.' }, { status: 400 });
    patch.active = value.active;
  }
  if (value.matchNames !== undefined) {
    if (!Array.isArray(value.matchNames)) {
      return NextResponse.json({ error: 'Invalid match names.' }, { status: 400 });
    }
    const matchNames = cleanMatchNames(value.matchNames);
    if (matchNames.length === 0) return NextResponse.json({ error: 'Keep at least one name.' }, { status: 400 });
    patch.matchNames = matchNames;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
  }

  try {
    const compound = await updateCompound(id, patch);
    if (!compound) return NextResponse.json({ error: 'This compound no longer exists.' }, { status: 404 });
    return NextResponse.json({ compound });
  } catch (error) {
    console.error('Failed to update compound', error);
    return NextResponse.json({ error: 'Could not save these changes. Try again.' }, { status: 500 });
  }
}

/**
 * Deletes a compound with its places and codes (ON DELETE CASCADE). The admin
 * asks staff to type the name first; hiding it (active: false) is the
 * reversible option and is offered next to this.
 */
export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const value = (await readBody(request)) ?? {};
  const id =
    typeof value.id === 'string' ? value.id : request.nextUrl.searchParams.get('id') ?? '';
  if (!UUID.test(id)) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  try {
    if (!(await deleteCompound(id))) {
      return NextResponse.json({ error: 'This compound no longer exists.' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete compound', error);
    return NextResponse.json({ error: 'Could not delete this compound. Try again.' }, { status: 500 });
  }
}
