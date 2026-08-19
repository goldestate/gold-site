import { NextRequest, NextResponse } from 'next/server';
import { supabase, RENTAL_PHOTOS_BUCKET } from '@/lib/supabase';
import { sniffImageExtension } from '@/lib/sniff-image';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
// Generous relative to the login/form limiters: an owner uploading a full photo set
// in one sitting can easily make more requests than a 5-per-15-minutes budget allows.
const MAX_UPLOADS_PER_WINDOW = 40;

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif'
};

export async function POST(request: NextRequest) {
  const clientKey = `rental-upload:${getClientKey(request)}`;
  const rateLimit = checkRateLimit(clientKey, { max: MAX_UPLOADS_PER_WINDOW });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Image is larger than 8MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniffImageExtension(buffer);
  if (!ext) {
    return NextResponse.json(
      { error: 'Unsupported or unrecognized image file. Use PNG, JPEG, WebP, or AVIF.' },
      { status: 400 }
    );
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(RENTAL_PHOTOS_BUCKET).upload(filename, buffer, {
    contentType: CONTENT_TYPES[ext],
    cacheControl: '31536000'
  });

  if (error) {
    console.error('Failed to upload rental photo', error);
    return NextResponse.json({ error: 'Could not upload this photo. Please try again.' }, { status: 500 });
  }

  const { data } = supabase.storage.from(RENTAL_PHOTOS_BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}
