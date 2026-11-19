import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { PROPERTY_PHOTOS_BUCKET } from '@/lib/supabase';
import { savePhoto } from '@/lib/file-storage';
import { sniffImageExtension } from '@/lib/sniff-image';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif'
};

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
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
  try {
    const url = await savePhoto(PROPERTY_PHOTOS_BUCKET, filename, buffer, CONTENT_TYPES[ext]);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Failed to upload photo', error);
    return NextResponse.json({ error: 'Could not upload this photo. Please try again.' }, { status: 500 });
  }
}
