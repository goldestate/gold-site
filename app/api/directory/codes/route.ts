import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createCode, revokeAllCodes, revokeCode, setCodeExpiry } from '@/lib/directory-store';
import { cairoToday, endOfCairoDay } from '@/lib/cairo-time';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * An end date arrives as a plain calendar day from a date input. It means a day
 * in Egypt, and the code runs to 23:59:59 Cairo time on it -- a stay ends when
 * the guest leaves, not at midnight as they wake up. Parsing it in the server's
 * own zone (UTC on Railway) made every code end on the wrong day.
 *
 * Today is allowed (the guest leaves tonight); anything earlier would create a
 * code that is dead on arrival and quietly filed under "finished".
 */
function readEndDate(raw: unknown): { expiresAt: string } | { error: string } {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { error: 'Pick the day the stay ends.' };
  }
  const day = raw.trim();
  const expiresAt = endOfCairoDay(day);
  if (!expiresAt) return { error: 'That end date is not a real date.' };
  // Both are YYYY-MM-DD, so string order is date order.
  if (day < cairoToday()) return { error: 'That end date has passed. Pick today or a later day.' };
  return { expiresAt };
}

/**
 * Four actions, deliberately distinct because they differ in who loses access:
 *
 *  'create'    -> a new code alongside the existing ones. Nobody loses anything.
 *                 This is the per-stay case: one code per guest, each with its
 *                 own end date. It needs a name and an explicit choice: an end
 *                 date, or `noEnd` for owners and staff. An empty date no longer
 *                 means "forever", because that is what a rushed tap produced.
 *  'extend'    -> moves one live code's end date (a longer or shorter stay). The
 *                 guest keeps the same code and link.
 *  'revoke'    -> ends one code. Only that guest is affected.
 *  'revokeAll' -> ends every live code for the compound. Everyone loses the
 *                 list, including anyone mid-stay.
 *
 * A code with an end date needs no action at all when the stay finishes: it stops
 * being redeemable, and devices that already redeemed it lose the list the next
 * time they reach the server.
 *
 * There is no GET: the compound page reads the store directly, and nothing
 * called the old one.
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
  const compoundId = typeof value.compoundId === 'string' ? value.compoundId : '';
  const codeId = typeof value.codeId === 'string' ? value.codeId : '';

  try {
    if (action === 'create') {
      if (!UUID.test(compoundId)) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });

      const label = typeof value.label === 'string' ? value.label.trim().slice(0, 120) : '';
      if (!label) {
        return NextResponse.json(
          { error: 'Name the code, e.g. the unit and the dates, so you can tell it apart later.' },
          { status: 400 }
        );
      }

      let expiresAt: string | null = null;
      if (value.noEnd !== true) {
        const end = readEndDate(value.expiresOn);
        if ('error' in end) {
          return NextResponse.json(
            { error: value.expiresOn ? end.error : 'Pick the day the stay ends, or tick "No end date".' },
            { status: 400 }
          );
        }
        expiresAt = end.expiresAt;
      }

      const code = await createCode({ compoundId, label, expiresAt });
      if (!code) return NextResponse.json({ error: 'This compound no longer exists.' }, { status: 404 });
      return NextResponse.json({ code }, { status: 201 });
    }

    if (action === 'extend') {
      if (!UUID.test(codeId)) return NextResponse.json({ error: 'codeId is required.' }, { status: 400 });
      const end = readEndDate(value.expiresOn);
      if ('error' in end) return NextResponse.json({ error: end.error }, { status: 400 });
      const code = await setCodeExpiry(codeId, end.expiresAt);
      if (!code) {
        return NextResponse.json({ error: 'That code has been revoked or deleted.' }, { status: 404 });
      }
      return NextResponse.json({ code });
    }

    if (action === 'revoke') {
      if (!UUID.test(codeId)) return NextResponse.json({ error: 'codeId is required.' }, { status: 400 });
      if (!(await revokeCode(codeId))) {
        return NextResponse.json({ error: 'That code no longer exists.' }, { status: 404 });
      }
      return NextResponse.json({ revoked: true });
    }

    if (action === 'revokeAll') {
      if (!UUID.test(compoundId)) return NextResponse.json({ error: 'compoundId is required.' }, { status: 400 });
      return NextResponse.json({ revoked: true, ended: await revokeAllCodes(compoundId) });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('Code action failed', error);
    return NextResponse.json({ error: 'Could not update the codes. Try again.' }, { status: 500 });
  }
}
