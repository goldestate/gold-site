import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { restoreDeletedProperty } from '@/lib/unit-activity';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: 'This unit is no longer in the deleted list.' }, { status: 404 });
  }

  try {
    const result = await restoreDeletedProperty(params.id);
    switch (result) {
      case 'restored':
        return NextResponse.json({ ok: true });
      case 'not-found':
        return NextResponse.json({ error: 'This unit is no longer in the deleted list.' }, { status: 404 });
      case 'exists':
        return NextResponse.json({ error: 'It is already back in the list.' }, { status: 409 });
      case 'unavailable':
        return NextResponse.json({ error: 'Restoring needs the database update (migration 008).' }, { status: 503 });
    }
  } catch (error) {
    console.error('Failed to restore property', error);
    return NextResponse.json({ error: 'Could not restore this unit. Please try again.' }, { status: 500 });
  }
}
