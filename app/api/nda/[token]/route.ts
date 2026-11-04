import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { sniffImageExtension } from '@/lib/sniff-image';
import { getNdaByToken, markNdaSigned, uploadNdaFile, type NdaMethod, type NdaSigner } from '@/lib/nda-store';
import { adminEmailAddress, isEmailShaped, sendEmail } from '@/lib/email';
import { adminNdaSignedEmail } from '@/lib/email-templates';
import { buildSignedNdaPdf, signedNdaFileName } from '@/lib/nda-pdf';
import { cleanPhone, toAsciiDigits } from '@/lib/phone';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf'
};

type DetailsResult = { ok: true; signer: NdaSigner | null } | { ok: false; field: 'name' | 'phone' | 'email' };

/**
 * The details typed on the signing page, which go on the signed PDF. Absent
 * from older pages, whose agreement keeps the details from the form.
 */
function readDetails(form: FormData): DetailsResult {
  const field = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : null;
  };
  const name = field('name');
  if (name === null) return { ok: true, signer: null };
  const company = field('company') ?? '';
  const phone = toAsciiDigits(field('phone') ?? '');
  const email = field('email') ?? '';
  if (name.length < 2 || name.length > 100) return { ok: false, field: 'name' };
  const digits = cleanPhone(phone).replace(/^\+/, '');
  if (digits.length < 7 || digits.length > 15 || phone.length > 30) return { ok: false, field: 'phone' };
  if (!isEmailShaped(email) || email.length > 254) return { ok: false, field: 'email' };
  return { ok: true, signer: { name, company: company.slice(0, 100), phone, email } };
}

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
 * plus agree=yes, the box they ticked to say they read it, and the details they
 * confirmed (name, company, phone, email), which go on the signed PDF.
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
  const details = readDetails(form);
  if (!details.ok) {
    return NextResponse.json({ error: 'Check your details.', field: details.field }, { status: 400 });
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
    const signed = await markNdaSigned(params.token, {
      method: method as NdaMethod,
      filePath: path,
      signer: details.signer ?? undefined
    });
    if (!signed) {
      return NextResponse.json({ error: 'This agreement is already signed.' }, { status: 409 });
    }

    const admin = adminEmailAddress();
    if (admin) {
      // After the reply: staff get the signed PDF attached, or the link alone if it can't be made.
      void (async () => {
        let pdf: { filename: string; content: string } | null = null;
        if (signed.method === 'drawn' && signed.signedAt) {
          try {
            const bytes = await buildSignedNdaPdf({ signer: signed.signer, signature: buffer, signedAt: new Date(signed.signedAt) });
            pdf = { filename: signedNdaFileName(signed.signer.name), content: Buffer.from(bytes).toString('base64') };
          } catch (error) {
            console.error('Could not build the signed agreement PDF for the email', error);
          }
        }
        await sendEmail(
          adminNdaSignedEmail({ to: admin, ndaId: signed.id, name: signed.signer.name, method: signed.method ?? 'uploaded', pdf })
        );
      })();
    }
    return NextResponse.json({ ok: true, signedAt: signed.signedAt });
  } catch (error) {
    console.error('Could not save the signed agreement', error);
    return NextResponse.json({ error: 'Could not save your signature. Please try again.' }, { status: 500 });
  }
}
