import { NextResponse } from 'next/server';
import { APP_ID } from '@/lib/app-links';

/**
 * Apple fetches this to decide whether gold-eg.com is allowed to open the app.
 *
 * Four things Apple requires, all of which this route satisfies and any of which
 * silently breaks universal links if changed:
 *   - served at exactly /.well-known/apple-app-site-association, no extension
 *   - Content-Type: application/json
 *   - HTTP 200 with no redirect (Apple does not follow them)
 *   - reachable over https with a valid certificate
 *
 * `dynamic = 'force-static'` because the body never varies by request; Apple's
 * CDN caches it aggressively regardless, which is also why the team id in
 * APP_ID has to be right before this ships — a wrong file is slow to undo.
 */
export const dynamic = 'force-static';

const association = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: [
          // The canonical link staff send.
          { '/': '/unlock/*', comment: 'Guest unlock codes' },
          // The locale-prefixed form. /unlock/X redirects to /en/unlock/X in the
          // browser, so this shape ends up in circulation whenever someone
          // copies the URL out of their address bar rather than the message.
          { '/': '/*/unlock/*', comment: 'Guest unlock codes, locale-prefixed' }
        ]
      }
    ]
  }
};

export async function GET() {
  return NextResponse.json(association, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
