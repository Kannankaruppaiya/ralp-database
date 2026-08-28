import { requireAdmin } from '@/lib/api/require-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;

  if (id === gate.actor.id) {
    return Response.json({ error: 'You cannot delete your own account.' }, { status: 409 });
  }

  const admin = supabaseAdmin();

  // The audit trail survives this. audit_log snapshots actor_name, actor_role
  // and gmc_number when each entry is written; only actor_id points at a live
  // row, and it is nullable.
  await admin.from('audit_log').update({ actor_id: null }).eq('actor_id', id);

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    const missing = /not found/i.test(error.message);
    return Response.json({ error: missing ? 'That account no longer exists.' : error.message }, {
      status: missing ? 404 : 502,
    });
  }

  await admin.from('profiles').delete().eq('id', id);

  await admin.from('audit_log').insert({
    actor_id: gate.actor.id,
    actor_name: gate.actor.name,
    actor_role: gate.actor.role,
    gmc_number: gate.actor.gmcNumber,
    action: 'STAFF_DELETED',
    details: `Deleted account ${id}`,
  });

  return Response.json({ ok: true });
}
