import { NextResponse } from 'next/server';

type InquiryPayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  interest?: unknown;
  message?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.EMAIL_TO;
  const emailFrom = process.env.EMAIL_FROM;

  if (!apiKey || !emailTo || !emailFrom) {
    return NextResponse.json(
      { error: 'Email service is not configured.' },
      { status: 500 }
    );
  }

  let payload: InquiryPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, phone, email, interest, message } = payload;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(phone) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(interest) ||
    !isNonEmptyString(message)
  ) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const safe = {
    name: escapeHtml(name.trim()),
    phone: escapeHtml(phone.trim()),
    email: escapeHtml(email.trim()),
    interest: escapeHtml(interest.trim()),
    message: escapeHtml(message.trim())
  };

  const text = [
    'New GOLD Investment Opportunities inquiry',
    '',
    `Name: ${name.trim()}`,
    `Phone: ${phone.trim()}`,
    `Email: ${email.trim()}`,
    `Interest: ${interest.trim()}`,
    '',
    'Message:',
    message.trim()
  ].join('\n');

  const html = `
    <h2>New GOLD Investment Opportunities inquiry</h2>
    <p><strong>Name:</strong> ${safe.name}</p>
    <p><strong>Phone:</strong> ${safe.phone}</p>
    <p><strong>Email:</strong> ${safe.email}</p>
    <p><strong>Interest:</strong> ${safe.interest}</p>
    <p><strong>Message:</strong></p>
    <p>${safe.message.replaceAll('\n', '<br />')}</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: emailFrom,
      to: emailTo,
      reply_to: email.trim(),
      subject: `New property inquiry from ${name.trim()}`,
      html,
      text
    })
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('Resend inquiry email failed:', details);
    return NextResponse.json(
      { error: 'Email could not be sent.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
