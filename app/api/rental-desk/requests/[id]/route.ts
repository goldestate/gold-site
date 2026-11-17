import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { deleteRentalRequest, reviewRentalRequest } from '@/lib/rental-desk-store';
import { removeNdaFilesFor } from '@/lib/nda-store';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Approves or rejects a request that is waiting for review: body { decision: 'approve' | 'reject' }. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const decision = (body as { decision?: unknown })?.decision;
  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
  }

  try {
    const reviewed = await reviewRentalRequest(params.id, decision);
    if (!reviewed) {
      return NextResponse.json({ error: 'This request is not waiting for review any more.' }, { status: 409 });
    }
    return NextResponse.json({ request: reviewed });
  } catch (error) {
    console.error('Failed to review rental request', error);
    return NextResponse.json({ error: 'Could not update this request. Please try again.' }, { status: 500 });
  }
}

/** Deletes an unwanted request, with its matches, its agreement and the agreement's files. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }

  try {
    await removeNdaFilesFor({ rentalRequestId: params.id });
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
