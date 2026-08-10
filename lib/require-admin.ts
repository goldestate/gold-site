import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from './admin-auth';

export async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
