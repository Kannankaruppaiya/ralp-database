import 'server-only';
import { withUser } from '@/server/db/pool';
import * as repo from '@/server/db/repositories/registry.repo';
import type { RecoveryPoint, SurgeonBenchmark, RegistrySummary } from '@/types/outcomes';

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function getRecoveryCurve(userId: string): Promise<RecoveryPoint[]> {
  const rows = await withUser(userId, (c) => repo.recoveryCurve(c));
  return rows.map((r) => ({
    milestone: r.milestone,
    months: r.target_months,
    continenceN: r.continence_n,
    potencyN: r.potency_n,
    continentPct: num(r.continent_pct),
    potentPct: num(r.potent_pct),
    meanPsa: num(r.mean_psa),
    bcrCount: r.bcr_count,
  }));
}

export async function getSurgeonBenchmark(userId: string): Promise<SurgeonBenchmark[]> {
  const rows = await withUser(userId, (c) => repo.surgeonBenchmark(c));
  return rows.map((r) => ({
    surgeon: r.surgeon,
    caseload: r.caseload,
    continenceN: r.continence_n,
    continenceRate: num(r.continence_rate),
    potencyN: r.potency_n,
    potencyRate: num(r.potency_rate),
    histologyN: r.histology_n,
    marginPositiveRate: num(r.margin_positive_rate),
  }));
}

export async function getRegistrySummary(userId: string): Promise<RegistrySummary | null> {
  const r = await withUser(userId, (c) => repo.registrySummary(c));
  if (!r) return null;
  return {
    patients: r.patients,
    operations: r.operations,
    completedFollowUps: r.completed_follow_ups,
    overdueFollowUps: r.overdue_follow_ups,
    bcrEvents: r.bcr_events,
    marginPositiveRate: num(r.margin_positive_rate),
  };
}
