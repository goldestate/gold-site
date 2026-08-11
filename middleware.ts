import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { ADMIN_COOKIE, verifySessionToken } from './lib/admin-auth';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/goldenadmin2026')) {
    if (pathname === '/goldenadmin2026/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const isValid = token ? await verifySessionToken(token) : false;

    if (!isValid) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/goldenadmin2026/login';
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
