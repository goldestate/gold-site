import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deleteRentalListing, updateRentalListingStatus } from '@/lib/rental-desk-store';
import { isRentalListingStatus } from '@/lib/rental-taxonomy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const status = (body as { status?: unknown })?.status;
  if (!isRentalListingStatus(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  try {
    const listing = await updateRentalListingStatus(params.id, status);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }
    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Failed to update rental listing status', error);
    return NextResponse.json({ error: 'Could not update this listing. Please try again.' }, { status: 500 });
  }
}

/** Deletes an unwanted owner listing, with its matches, its agreement and the agreement's files, and its photos. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }

  try {
    const result = await deleteRentalListing(params.id);
    if (result === 'in-house') {
      return NextResponse.json(
        { error: 'This listing comes from Properties. Remove or change it there.' },
        { status: 409 }
      );
    }
    if (result === 'not-found') {
      return NextResponse.json({ error: 'Listing not found. It may already be deleted.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete rental listing', error);
    return NextResponse.json({ error: 'Could not delete this listing. Please try again.' }, { status: 500 });
  }
}
