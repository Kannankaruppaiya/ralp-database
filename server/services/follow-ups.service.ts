import 'server-only';
import { withUser } from '@/server/db/pool';
import * as repo from '@/server/db/repositories/clinical.repo';
import { toFollowUp, toPatient, fromFollowUp, fromProm } from '@/lib/supabase/mappers';
import type { FollowUpRecord } from '@/types/follow-up';
import type { PromSubmission } from '@/types/prom';

export async function getFollowUps(userId: string, status?: 'due' | 'overdue' | 'completed') {
  const rows = await withUser(userId, (client) => repo.listFollowUps(client, status));
  return rows.map((r) => ({
    followUp: toFollowUp(r),
    patient: toPatient(r.patients),
  }));
}

export async function updateFollowUp(userId: string, f: FollowUpRecord): Promise<void> {
  await withUser(userId, (client) => repo.upsertFollowUp(client, fromFollowUp(f)));
}

export async function refreshFollowUpStatus(userId: string, patientId?: string): Promise<void> {
  await withUser(userId, (client) => repo.refreshFollowUpStatus(client, patientId ?? null));
}

export async function addPromSubmission(userId: string, prom: PromSubmission): Promise<void> {
  await withUser(userId, (client) => repo.insertProm(client, fromProm(prom)));
}
