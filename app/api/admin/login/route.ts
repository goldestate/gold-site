import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, checkPassword, createSessionToken } from '@/lib/admin-auth';
import { checkRateLimit, getClientKey, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_PASSWORD on the server.' },
      { status: 500 }
    );
  }

  const clientKey = `login:${getClientKey(request)}`;
  const rateLimit = checkRateLimit(clientKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  let payload: { password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof payload.password !== 'string' || !checkPassword(payload.password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  resetRateLimit(clientKey);

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
