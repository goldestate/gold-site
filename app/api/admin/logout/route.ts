import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-auth';

/**
 * Clears the session cookie in this browser. The cookie is matched by name and
 * path, so the same attributes as login are repeated here; an expiry in the past
 * plus Max-Age=0 covers browsers that honour only one of them.
 *
 * The token itself is stateless and stays valid until it expires if it was
 * copied off the device. To end every session everywhere -- a lost staff phone --
 * change ADMIN_PASSWORD: the signing key is derived from it (lib/admin-auth.ts).
 */
export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}
