import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deleteRentalRequest } from '@/lib/rental-desk-store';
import { removeNdaFilesForRequest } from '@/lib/nda-store';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deletes an unwanted request, with its matches, its agreement and the agreement's files. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }

  try {
    await removeNdaFilesForRequest(params.id);
    const deleted = await deleteRentalRequest(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Request not found. It may already be deleted.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete rental request', error);
    return NextResponse.json({ error: 'Could not delete this request. Please try again.' }, { status: 500 });
  }
}
