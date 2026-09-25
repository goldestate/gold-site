import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { isShortMapLink, parsePin } from '@/lib/map-pin';

export const dynamic = 'force-dynamic';

const MAX_HOPS = 5;
const TIMEOUT_MS = 5000;

const NO_PIN =
  "That link doesn't say where the place is. In Google Maps, press and hold on the compound to drop a pin, then copy the numbers it shows (like 30.98712, 28.76543) and paste those here.";

/** A malformed %-escape would throw; the raw text is still worth parsing. */
function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Only Google's shortener is ever fetched. Anything it points to is read, never requested. */
function isShortener(url: URL): boolean {
  return url.protocol === 'https:' && (url.hostname === 'maps.app.goo.gl' || url.hostname === 'goo.gl');
}

/**
 * Expands a Google Maps share link into a pin.
 *
 * Sharing a place from the Google Maps app gives a maps.app.goo.gl link, which
 * has no coordinates in it: they are in the long URL it redirects to. The admin
 * page can't follow that redirect itself (the browser won't show it the
 * Location header), so this does, and only this far: it requests goo.gl
 * addresses and nothing else, and parses wherever they point without opening
 * it. That is what keeps an admin-only fetcher from becoming a way to make the
 * server request arbitrary URLs.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const raw = typeof (body as { url?: unknown })?.url === 'string' ? (body as { url: string }).url.trim() : '';
  if (!isShortMapLink(raw)) {
    return NextResponse.json({ error: 'Paste a Google Maps link (maps.app.goo.gl/...).' }, { status: 400 });
  }

  let current = new URL(raw);
  try {
    for (let hop = 0; hop < MAX_HOPS && isShortener(current); hop += 1) {
      const res = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GOLD admin link expander)' }
      });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        current = new URL(location, current);
        continue;
      }
      // Some responses are a page that redirects in script instead. The long
      // Maps URL is then somewhere in the markup; read it, don't follow it.
      if (res.ok) {
        const html = (await res.text()).slice(0, 300_000);
        for (const match of html.matchAll(/https:\/\/(?:www\.)?google\.[a-z.]+\/maps[^"'\s<>\\]*/g)) {
          const pin = parsePin(decode(match[0].replace(/&amp;/g, '&')));
          if (pin) return NextResponse.json({ pin });
        }
      }
      break;
    }
  } catch {
    return NextResponse.json(
      { error: 'Could not open that link from here. Paste the coordinates instead.' },
      { status: 502 }
    );
  }

  const pin = parsePin(decode(current.toString()));
  if (!pin) return NextResponse.json({ error: NO_PIN }, { status: 422 });
  return NextResponse.json({ pin });
}
