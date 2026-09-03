import 'server-only';
import { withUser } from '@/server/db/pool';
import * as repo from '@/server/db/repositories/registry.repo';
import { writeAudit } from '@/server/db/repositories/clinical.repo';

/**
 * Two distinct products: one that carries no identifier, one that does.
 * Selecting between them is the caller's explicit decision, and each is audited
 * under its own action — the audit write is in the same transaction as the read.
 */

export async function exportPseudonymised(userId: string): Promise<Record<string, unknown>[]> {
  return withUser(userId, async (client) => {
    const rows = await repo.exportPseudonymised(client);
    await writeAudit(client, 'EXPORT_PSEUDONYMISED', null, `${rows.length} records, no identifiers`);
    return rows;
  });
}

export async function exportIdentifiable(userId: string): Promise<Record<string, unknown>[]> {
  return withUser(userId, async (client) => {
    const rows = await repo.exportIdentifiable(client);
    await writeAudit(
      client, 'EXPORT_IDENTIFIABLE', null,
      `${rows.length} records including NHS number, hospital number, name and date of birth`
    );
    return rows;
  });
}
