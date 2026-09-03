import { requireAdmin } from '@/lib/api/require-admin';
import { pool } from '@/server/db/pool';
import { writeAudit } from '@/server/services/audit.service';

export const runtime = 'nodejs';

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

  // The audit trail survives this. audit_log snapshots actor_name, actor_role
  // and gmc_number when each entry is written; only actor_id points at a live
  // row, so it is nulled before the profile it references is removed.
  await pool.query('update audit_log set actor_id = null where actor_id = $1', [id]);

  // Deleting the user cascades to the profile (profiles.id references users on
  // delete cascade).
  const { rowCount } = await pool.query('delete from users where id = $1', [id]);
  if (!rowCount) {
    return Response.json({ error: 'That account no longer exists.' }, { status: 404 });
  }

  await writeAudit(gate.actor.id, 'STAFF_DELETED', undefined, `Deleted account ${id}`);

  return Response.json({ ok: true });
}
