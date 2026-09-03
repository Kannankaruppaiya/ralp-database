import 'server-only';
import { cookies } from 'next/headers';
import { signSession, verifySession } from './jwt';

/**
 * The session cookie. httpOnly so client JavaScript can never read the token,
 * SameSite=Lax to blunt CSRF, Secure in production. Read/write helpers wrap the
 * Next.js cookie store so route handlers never touch cookie internals.
 */
const COOKIE = 'ralp_session';
const MAX_AGE = 60 * 60 * 12; // 12h, matches the JWT TTL

export async function startSession(userId: string): Promise<void> {
  const token = await signSession(userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user's id from the cookie, or null. */
export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verifySession(token) : null;
}
