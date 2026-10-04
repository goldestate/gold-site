import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { sniffImageExtension } from '@/lib/sniff-image';
import { getNdaByToken, markNdaSigned, uploadNdaFile, type NdaMethod } from '@/lib/nda-store';
import { adminEmailAddress, sendEmail } from '@/lib/email';
import { adminNdaSignedEmail } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf'
};

/** PDF files start with "%PDF-"; checked from the bytes, never the file name. */
function sniffSignedCopy(buffer: Buffer): 'png' | 'jpg' | 'webp' | 'pdf' | null {
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  const image = sniffImageExtension(buffer);
  return image === 'png' || image === 'jpg' || image === 'webp' ? image : null;
}

/**
 * Signs the agreement behind a signing link. Two ways, both one request:
 *   method=drawn     file = the signature drawn on screen, as a PNG
 *   method=uploaded  file = a photo or PDF of a copy they signed themselves
 * plus agree=yes, the box they ticked to say they read it.
 *
 * The token is the only key, and it works once: a signed agreement can't be
 * signed again or replaced through its link.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const rateLimit = checkRateLimit(`nda:${getClientKey(request)}`, { max: 20 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const method = form.get('method');
  const file = form.get('file');
  if ((method !== 'drawn' && method !== 'uploaded') || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
  }
  if (form.get('agree') !== 'yes') {
    return NextResponse.json({ error: 'The agreement has to be accepted.' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'The file must be under 10 MB.' }, { status: 400 });
  }

  let nda;
  try {
    nda = await getNdaByToken(params.token);
  } catch (error) {
    console.error('Could not read the agreement', error);
    return NextResponse.json({ error: 'Could not save your signature. Please try again.' }, { status: 500 });
  }
  if (!nda) return NextResponse.json({ error: 'This signing link is not valid.' }, { status: 404 });
  if (nda.status === 'signed') {
    return NextResponse.json({ error: 'This agreement is already signed.' }, { status: 409 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniffSignedCopy(buffer);
  // A drawn signature is always the PNG the page makes; anything else is not one.
  if (!ext || (method === 'drawn' && ext !== 'png')) {
    return NextResponse.json(
      { error: 'Unsupported file. Use a photo (JPEG, PNG or WebP) or a PDF.' },
      { status: 400 }
    );
  }

  const path = `${nda.id}/${method}-${Date.now()}.${ext}`;
  try {
    await uploadNdaFile(path, buffer, CONTENT_TYPES[ext]);
    const signed = await markNdaSigned(params.token, { method: method as NdaMethod, filePath: path });
    if (!signed) {
      return NextResponse.json({ error: 'This agreement is already signed.' }, { status: 409 });
    }

    const admin = adminEmailAddress();
    if (admin) {
      void sendEmail(
        adminNdaSignedEmail({ to: admin, ndaId: signed.id, name: signed.signer.name, method: signed.method ?? 'uploaded' })
      );
    }
    return NextResponse.json({ ok: true, signedAt: signed.signedAt });
  } catch (error) {
    console.error('Could not save the signed agreement', error);
    return NextResponse.json({ error: 'Could not save your signature. Please try again.' }, { status: 500 });
  }
}
