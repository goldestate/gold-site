import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deleteRentalRequest, isRowId } from '@/lib/rental-desk-store';

/** Deletes the request for good (see deleteRentalRequest). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isRowId(params.id)) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }

  try {
    const deleted = await deleteRentalRequest(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete rental request', error);
    return NextResponse.json({ error: 'Could not delete this request. Please try again.' }, { status: 500 });
  }
}
