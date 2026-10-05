import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deleteRentalListing, isRowId, updateRentalListingStatus } from '@/lib/rental-desk-store';
import { isRentalListingStatus } from '@/lib/rental-taxonomy';

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

/** Deletes the listing for good (see deleteRentalListing). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isRowId(params.id)) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }

  try {
    const result = await deleteRentalListing(params.id);
    if (result === 'not_found') {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }
    if (result === 'in_house') {
      return NextResponse.json(
        { error: 'This is one of GOLD’s own units. Change or delete it in Properties.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete rental listing', error);
    return NextResponse.json({ error: 'Could not delete this listing. Please try again.' }, { status: 500 });
  }
}
