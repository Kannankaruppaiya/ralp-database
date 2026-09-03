import 'server-only';
import { NextResponse } from 'next/server';
import { currentUserId } from '@/server/auth/session';
import { loadProfile } from '@/server/auth/profile';

/**
 * Route-handler helpers. The API is the trust boundary now that the browser no
 * longer talks to Postgres directly, so every data route starts by resolving the
 * caller from the session cookie and runs its queries scoped to that user.
 */

/** Resolves the signed-in user id, or returns a 401 response to return directly. */
export async function requireUser(): Promise<{ userId: string } | NextResponse> {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return { userId };
}

/**
 * Resolves the caller and asserts their role, for endpoints that are not open to
 * every signed-in user (e.g. the admin console). Enforced here at the API — the
 * app-layer authorization wall — in addition to row level security underneath.
 */
export async function requireRole(
  roles: string[]
): Promise<{ userId: string; role: string } | NextResponse> {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const profile = await loadProfile(userId);
  if (!profile || !roles.includes(profile.role)) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  return { userId, role: profile.role };
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Parses a JSON body, returning null on any parse error (never throws). */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  return request.json().catch(() => null) as Promise<T | null>;
}
