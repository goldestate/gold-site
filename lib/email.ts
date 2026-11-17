/**
 * Server-only. Sends an email through Resend's HTTP API, the same account and
 * settings the enquiry form already uses (app/api/inquiry):
 *   RESEND_API_KEY   the key from resend.com (required to send anything)
 *   EMAIL_FROM       the verified sender, e.g. "GOLD <no-reply@gold-eg.com>"
 *   EMAIL_TO         GOLD's inbox: replies to confirmations go there, and staff
 *                    are told about new submissions and signed agreements there
 * EMAIL_REPLY_TO and EMAIL_ADMIN_TO override those two uses separately. New
 * listings and requests also always reach gold.domain01@ and gold.admin01@gmail.com.
 *
 * Never throws and never blocks a form: without a key nothing is sent, and a
 * failed send is logged. A visitor's request must not fail because an email did.
 */

const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'GOLD <no-reply@gold-eg.com>';
const DEFAULT_REPLY_TO = 'gold.domain01@gmail.com';

export type Email = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Files to attach, as base64. */
  attachments?: { filename: string; content: string }[];
};

let warnedNoKey = false;

export async function sendEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      console.warn('RESEND_API_KEY is not set, so confirmation emails are not being sent.');
    }
    return false;
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: Array.isArray(email.to) ? email.to : [email.to],
        reply_to: process.env.EMAIL_REPLY_TO || process.env.EMAIL_TO || DEFAULT_REPLY_TO,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.attachments?.length ? { attachments: email.attachments } : {})
      }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error('Email was not sent', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email was not sent', error);
    return false;
  }
}

/** Where staff notifications go (EMAIL_ADMIN_TO, else EMAIL_TO), or null when none are wanted. */
export function adminEmailAddress(): string | null {
  return process.env.EMAIL_ADMIN_TO?.trim() || process.env.EMAIL_TO?.trim() || null;
}

/** The two inboxes told about every new listing and request. */
const SUBMISSION_INBOXES = ['gold.domain01@gmail.com', 'gold.admin01@gmail.com'];

/**
 * New listings and requests only: both inboxes above, plus the usual staff
 * address when it is another one. Gmail ignores letter case, so one copy each.
 */
export function submissionEmailAddresses(): string[] {
  const addresses = [...SUBMISSION_INBOXES, adminEmailAddress() ?? ''].filter(Boolean);
  return addresses.filter(
    (address, index) => addresses.findIndex((other) => other.toLowerCase() === address.toLowerCase()) === index
  );
}

export { isEmailShaped } from './email-address';
