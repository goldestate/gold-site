import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { readActiveCode, revokeAllCodes, rotateCode } from '@/lib/directory-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const compoundId = request.nextUrl.searchParams.get('compoundId');
  if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });
  try {
    return NextResponse.json({ code: await readActiveCode(compoundId) });
  } catch (error) {
    console.error('Failed to read code', error);
    return NextResponse.json({ error: 'Could not load the code.' }, { status: 500 });
  }
}

/**
 * action 'rotate' -> new code, old one stops accepting NEW redemptions, already
 * unlocked devices keep access. action 'revoke' -> drops every redemption, so
 * guests mid-stay lose the vetted list. Two separate actions on purpose.
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
  const compoundId = typeof value.compoundId === 'string' ? value.compoundId : '';
  const action = value.action;
  if (!compoundId) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });

  try {
    if (action === 'revoke') {
      await revokeAllCodes(compoundId);
      const code = await rotateCode(compoundId);
      return NextResponse.json({ code, revoked: true });
    }
    if (action === 'rotate') {
      return NextResponse.json({ code: await rotateCode(compoundId) });
    }
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('Code action failed', error);
    return NextResponse.json({ error: 'Could not update the code.' }, { status: 500 });
  }
}
