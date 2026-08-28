import { supabaseServer } from '@/lib/supabase/server';

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
 * middleware.ts guards pages, not route handlers, so each route has to
 * establish for itself who is calling. The role is read from the caller's own
 * profile row rather than from anything in the request, because a caller can
 * shape a request body freely.
 */
export async function requireAdmin(): Promise<AdminGate> {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return deny(401, 'Sign in to continue.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, gmc_number')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'Data Manager') {
    return deny(403, 'Administrator access is required.');
  }

  return {
    ok: true,
    actor: {
      id: profile.id,
      name: profile.full_name,
      role: profile.role,
      gmcNumber: profile.gmc_number ?? null,
    },
  };
}
