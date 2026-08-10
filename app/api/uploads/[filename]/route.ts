import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { UPLOADS_DIR } from '@/lib/properties-store';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif'
};

export async function GET(_request: NextRequest, { params }: { params: { filename: string } }) {
  const safeName = path.basename(params.filename);
  const ext = path.extname(safeName).slice(1).toLowerCase();
  const contentType = MIME_TYPES[ext];

  if (!contentType) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const data = await fs.readFile(path.join(UPLOADS_DIR, safeName));
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
