import 'server-only';
import { currentUserId } from '@/server/auth/session';
import { loadProfile } from '@/server/auth/profile';

export type Actor = {
  id: string;
  name: string;
  role: string;
  gmcNumber: string | null;
};

export type AdminGate =
  | { ok: true; actor: Actor }
  | { ok: false; response: Response };

const deny = (status: number, error: string): AdminGate => ({
  ok: false,
  response: Response.json({ error }, { status }),
});

/**
 * Authorisation for every route under /api/admin.
 *
 * middleware.ts guards pages, not route handlers, so each route establishes for
 * itself who is calling. The role is read from the caller's own profile row
 * (resolved from the session cookie) rather than from anything in the request,
 * because a caller can shape a request body freely.
 */
export async function requireAdmin(): Promise<AdminGate> {
  const userId = await currentUserId();
  if (!userId) return deny(401, 'Sign in to continue.');

  const profile = await loadProfile(userId);
  if (!profile || profile.role !== 'Data Manager') {
    return deny(403, 'Administrator access is required.');
  }

  return {
    ok: true,
    actor: {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      gmcNumber: profile.gmcNumber ?? null,
    },
  };
}
