import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { downloadNdaFile, getNdaById } from '@/lib/nda-store';
import { buildSignedNdaPdf, signedNdaFileName } from '@/lib/nda-pdf';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The signed agreement as a PDF, for staff: GOLD's PDF with the signer's details,
 * signature and date on it. Made fresh from what's stored each time it's opened,
 * so agreements signed before this existed have one too.
 *
 *   ?download=1  saves the file instead of opening it
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) {
    // Opened as a link, so send staff to log in rather than show them an error.
    return NextResponse.redirect(new URL('/goldenadmin2026/login', request.url));
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });
  }

  try {
    const nda = await getNdaById(params.id);
    if (!nda || nda.status !== 'signed' || nda.method !== 'drawn' || !nda.filePath || !nda.signedAt) {
      return NextResponse.json({ error: 'There is no signed-on-screen agreement here.' }, { status: 404 });
    }
    const pdf = await buildSignedNdaPdf({
      signer: nda.signer,
      signature: await downloadNdaFile(nda.filePath),
      signedAt: new Date(nda.signedAt)
    });
    const name = signedNdaFileName(nda.signer.name);
    const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${name.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'private, no-store'
      }
    });
  } catch (error) {
    console.error('Could not build the signed agreement PDF', error);
    return NextResponse.json({ error: 'Could not make the PDF. Reload to try again.' }, { status: 500 });
  }
}
