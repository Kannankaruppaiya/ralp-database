import 'server-only';
import { NextResponse } from 'next/server';
import { currentUserId } from '@/server/auth/session';

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

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Parses a JSON body, returning null on any parse error (never throws). */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  return request.json().catch(() => null) as Promise<T | null>;
}
