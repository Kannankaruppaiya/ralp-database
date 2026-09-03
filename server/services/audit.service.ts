import 'server-only';
import { withUser } from '@/server/db/pool';
import * as repo from '@/server/db/repositories/clinical.repo';
import { toAudit } from '@/lib/mappers';

export async function getAuditLogs(userId: string, limit = 200) {
  const rows = await withUser(userId, (client) => repo.listAudit(client, limit));
  return rows.map(toAudit);
}

/**
 * Records an explicit action (a view, an export, an approval). Actor identity is
 * taken from the session inside the SQL function, so the caller cannot claim to
 * be someone else. A failed audit write is logged, not thrown, matching the old
 * client's behaviour.
 */
export async function writeAudit(
  userId: string, action: string, patientId?: string, details?: string
): Promise<void> {
  try {
    await withUser(userId, (client) =>
      repo.writeAudit(client, action, patientId ?? null, details ?? null));
  } catch (err) {
    console.warn('audit write failed:', (err as Error).message);
  }
}
