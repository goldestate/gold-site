import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { updateRentalListingStatus } from '@/lib/rental-desk-store';
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
