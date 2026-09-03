import { requireAdmin } from '@/lib/api/require-admin';
import { withUser } from '@/server/db/pool';
import { writeAudit } from '@/server/services/audit.service';

export const runtime = 'nodejs';

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

  const deactivatedAt = body.active ? null : new Date().toISOString();

  // users.status gates sign-in (the login route rejects anything but 'active');
  // profiles.deactivated_at is the human-facing timestamp the console shows.
  // Both move together in one transaction.
  const changed = await withUser(null, async (client) => {
    const { rowCount } = await client.query(
      'update users set status = $1 where id = $2',
      [body.active ? 'active' : 'disabled', id]
    );
    if (!rowCount) return false;
    await client.query('update profiles set deactivated_at = $1 where id = $2', [
      deactivatedAt,
      id,
    ]);
    return true;
  });

  if (!changed) {
    return Response.json({ error: 'That account no longer exists.' }, { status: 404 });
  }

  await writeAudit(
    gate.actor.id,
    body.active ? 'STAFF_REACTIVATED' : 'STAFF_DEACTIVATED',
    undefined,
    `Account ${id} ${body.active ? 'reactivated' : 'deactivated'}`
  );

  return Response.json({ ok: true, deactivatedAt });
}
