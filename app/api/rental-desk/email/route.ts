import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { isEmailShaped, sendEmail } from '@/lib/email';
import { followUpEmail } from '@/lib/email-templates';
import {
  FOLLOW_UP_MAX_RECIPIENTS,
  FOLLOW_UP_MESSAGE_MAX,
  FOLLOW_UP_SUBJECT_MAX,
  customText,
  isFollowUpAudience,
  isFollowUpTemplate,
  templateText
} from '@/lib/follow-up-emails';
import { isRowId, readFollowUpRecipients } from '@/lib/rental-desk-store';

export const dynamic = 'force-dynamic';

/** Resend allows two requests a second; one every 600 ms stays under it. */
const SEND_GAP_MS = 600;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Emails the owners or brokers staff ticked on the Rental Desk: a ready-made
 * message, or one staff wrote. Each person gets their own email with their own
 * name; nobody sees anyone else's address. Nothing is stored.
 *
 * Body: { audience: 'owners' | 'brokers', ids: string[], template, subject?, message? }
 * Answers with who it went to, who has no address on file, and who it failed
 * for, as { id, name } so the admin can keep the failed ones ticked to retry.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { audience, template } = body;
  if (!isFollowUpAudience(audience) || !isFollowUpTemplate(template)) {
    return NextResponse.json({ error: 'Choose a message.' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? Array.from(new Set(body.ids.filter(isRowId))) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Tick at least one person.' }, { status: 400 });
  }
  if (ids.length > FOLLOW_UP_MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Up to ${FOLLOW_UP_MAX_RECIPIENTS} people at a time. Untick some and send the rest after.` },
      { status: 400 }
    );
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (template === 'custom') {
    if (!subject || subject.length > FOLLOW_UP_SUBJECT_MAX) {
      return NextResponse.json({ error: `Write a subject, up to ${FOLLOW_UP_SUBJECT_MAX} characters.` }, { status: 400 });
    }
    if (!message || message.length > FOLLOW_UP_MESSAGE_MAX) {
      return NextResponse.json({ error: `Write a message, up to ${FOLLOW_UP_MESSAGE_MAX} characters.` }, { status: 400 });
    }
  }

  let recipients;
  try {
    recipients = await readFollowUpRecipients(audience, ids);
  } catch (error) {
    console.error('Could not read the people to email', error);
    return NextResponse.json({ error: 'Could not load these people. Please try again.' }, { status: 500 });
  }

  type Person = { id: string; name: string };
  const sent: Person[] = [];
  const noEmail: Person[] = [];
  const failed: Person[] = [];
  // A message staff wrote is the same for every listing, so a person ticked
  // twice gets it once. Ready-made ones name the property, so each one goes.
  const written = new Set<string>();

  for (const recipient of recipients) {
    const person = { id: recipient.id, name: recipient.name };
    if (!isEmailShaped(recipient.email)) {
      noEmail.push(person);
      continue;
    }
    const address = recipient.email.trim();
    if (template === 'custom') {
      if (written.has(address.toLowerCase())) continue;
      written.add(address.toLowerCase());
    }

    const text =
      template === 'custom'
        ? customText(recipient.name, subject, message)
        : templateText(audience, template, recipient);
    if (sent.length + failed.length > 0) await pause(SEND_GAP_MS);
    const ok = await sendEmail(followUpEmail(address, text));
    (ok ? sent : failed).push(person);
  }

  return NextResponse.json({ sent, noEmail, failed, notFound: ids.length - recipients.length });
}
