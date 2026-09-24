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
          { '/': '/unlock/*', comment: 'Guest unlock codes' }
          // The locale-prefixed form (/en/unlock/X, /ar/unlock/X) is deliberately
          // NOT claimed. /unlock/X redirects there in the browser, so it does
          // circulate, but the shipped app's DeepLink parser only understands
          // /unlock/X: claiming /*/unlock/* opened the app and then did nothing,
          // and the web page -- whose "Open in app" button works -- never loaded.
          // Put `{ '/': '/*/unlock/*' }` back once an app version that parses
          // /en|ar/unlock/X is the one guests have. Apple's CDN caches this file
          // for hours to a day, so either change reaches phones slowly.
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
