import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { markMatchSent } from '@/lib/rental-desk-store';
import { notifyBrokerOfMatch } from '@/lib/rental-desk-notify';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await markMatchSent(params.id);
    if (!result) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    // Phase 5 hook: this is where the broker actually gets pinged on WhatsApp.
    await notifyBrokerOfMatch({
      brokerName: result.brokerName,
      brokerPhone: result.brokerPhone,
      brokerWhatsapp: result.brokerWhatsapp,
      referenceCode: result.referenceCode,
      matchScore: result.match.matchScore
    });

    return NextResponse.json({ match: result.match });
  } catch (error) {
    console.error('Failed to mark match as sent', error);
    return NextResponse.json({ error: 'Could not update this match. Please try again.' }, { status: 500 });
  }
}
