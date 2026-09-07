import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createCode, readCodes, revokeAllCodes, revokeCode } from '@/lib/directory-store';

export const dynamic = 'force-dynamic';

/** Every code for a compound, live and finished, newest first. */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const compoundId = request.nextUrl.searchParams.get('compoundId');
  if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });
  try {
    return NextResponse.json({ codes: await readCodes(compoundId) });
  } catch (error) {
    console.error('Failed to read codes', error);
    return NextResponse.json({ error: 'Could not load the codes.' }, { status: 500 });
  }
}

/**
 * Three actions, deliberately distinct because they differ in who loses access:
 *
 *  'create'    -> a new code alongside the existing ones. Nobody loses anything.
 *                 This is the per-stay case: one code per guest, each with its
 *                 own end date.
 *  'revoke'    -> ends one code and drops the devices that redeemed it. Only that
 *                 guest is affected.
 *  'revokeAll' -> ends every code for the compound. Everyone loses the list,
 *                 including anyone mid-stay.
 *
 * A code with an end date needs no action at all when the stay finishes: it stops
 * being redeemable, and devices that already redeemed it lose the list the next
 * time they reach the server.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const value = (body ?? {}) as Record<string, unknown>;
  const action = value.action;

  try {
    if (action === 'create') {
      const compoundId = typeof value.compoundId === 'string' ? value.compoundId : '';
      if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });

      const label = typeof value.label === 'string' ? value.label.trim().slice(0, 120) : '';

      // An end date arrives as a plain calendar day from a date input. A stay ends
      // when the guest leaves, not at midnight as they wake up, so the code runs
      // to the end of that day rather than its start.
      let expiresAt: string | null = null;
      if (typeof value.expiresOn === 'string' && value.expiresOn.trim()) {
        const parsed = new Date(`${value.expiresOn}T23:59:59`);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: 'That end date is not valid.' }, { status: 400 });
        }
        expiresAt = parsed.toISOString();
      }

      return NextResponse.json({ code: await createCode({ compoundId, label, expiresAt }) }, { status: 201 });
    }

    if (action === 'revoke') {
      const codeId = typeof value.codeId === 'string' ? value.codeId : '';
      if (!codeId) return NextResponse.json({ error: 'codeId is required.' }, { status: 400 });
      await revokeCode(codeId);
      return NextResponse.json({ revoked: true });
    }

    if (action === 'revokeAll') {
      const compoundId = typeof value.compoundId === 'string' ? value.compoundId : '';
      if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });
      await revokeAllCodes(compoundId);
      return NextResponse.json({ revoked: true });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('Code action failed', error);
    return NextResponse.json({ error: 'Could not update the codes.' }, { status: 500 });
  }
}
