import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { UPLOADS_DIR } from '@/lib/properties-store';
import { sniffImageExtension } from '@/lib/sniff-image';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

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

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return NextResponse.json({ url: `/api/uploads/${filename}` });
}
