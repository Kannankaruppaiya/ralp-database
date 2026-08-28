import { requireAdmin } from '@/lib/api/require-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** Supabase expresses an indefinite ban as a very long duration. */
const FOREVER = '876000h';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;

  // An administrator who deactivates their own account locks everyone out of
  // the console, and no other door grants admin.
  if (id === gate.actor.id) {
    return Response.json({ error: 'You cannot deactivate your own account.' }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.active !== 'boolean') {
    return Response.json({ error: 'Send { active: boolean }.' }, { status: 422 });
  }

  const admin = supabaseAdmin();
  const deactivatedAt = body.active ? null : new Date().toISOString();

  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: body.active ? 'none' : FOREVER,
  });
  if (error) {
    const missing = /not found/i.test(error.message);
    return Response.json({ error: missing ? 'That account no longer exists.' : error.message }, {
      status: missing ? 404 : 502,
    });
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ deactivated_at: deactivatedAt })
    .eq('id', id);
  if (profileError) return Response.json({ error: profileError.message }, { status: 502 });

  await admin.from('audit_log').insert({
    actor_id: gate.actor.id,
    actor_name: gate.actor.name,
    actor_role: gate.actor.role,
    gmc_number: gate.actor.gmcNumber,
    action: body.active ? 'STAFF_REACTIVATED' : 'STAFF_DEACTIVATED',
    details: `Account ${id} ${body.active ? 'reactivated' : 'deactivated'}`,
  });

  return Response.json({ ok: true, deactivatedAt });
}
