import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_TTL_SECONDS, checkPassword, createSessionToken } from '@/lib/admin-auth';
import { checkRateLimit, getClientKey, resetRateLimit } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Counts the attempt in Postgres, so a deploy or restart no longer hands a
 * password guesser a fresh five tries. Imported lazily: lib/supabase.ts throws
 * at import when its env vars are missing, and admin login is the recovery path
 * -- it must keep working (on the in-memory count) even then.
 */
async function takeAttempt(key: string): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
  reset: () => Promise<void>;
}> {
  try {
    const { consumeRateLimit } = await import('@/lib/rate-limit-durable');
    return await consumeRateLimit(key, { max: MAX_ATTEMPTS, windowMs: WINDOW_MS });
  } catch (error) {
    console.error('Durable rate limit could not load, falling back to in-memory', error);
    const result = checkRateLimit(key, { max: MAX_ATTEMPTS, windowMs: WINDOW_MS });
    return { ...result, reset: async () => resetRateLimit(key) };
  }
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_PASSWORD on the server.' },
      { status: 500 }
    );
  }

  // JSON only (the login form sends it). A text/plain POST needs no CORS
  // preflight, so without this any web page could have its visitors' browsers
  // guess the password, each from its own IP and its own five tries.
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^application\/json\b/i.test(contentType.trim())) {
    return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415 });
  }

  const attempt = await takeAttempt(`login:${getClientKey(request)}`);
  if (!attempt.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, attempt.retryAfterSeconds)) } }
    );
  }

  let payload: { password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof payload.password !== 'string' || !(await checkPassword(payload.password))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  // Whoever got here knows the password, so their earlier typos stop counting.
  await attempt.reset();

  const token = await createSessionToken();
  if (!token) {
    // Unreachable while ADMIN_PASSWORD is set (the signing key derives from it),
    // but if it ever happens, refuse rather than hand out an unsigned session.
    return NextResponse.json({ error: 'Admin sessions are not configured on the server.' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
  return response;
}
