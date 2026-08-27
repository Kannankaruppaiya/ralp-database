import { SurgeonCode } from './common';
import { FollowUpMilestone } from './follow-up';

/**
 * Aggregate outcome measures. Every field is computed in Postgres; nothing here
 * is derived a second time in the browser, so two screens cannot disagree.
 *
 * A `null` rate means the denominator was zero — that milestone has no completed
 * assessments yet. Render it as "no data", never as 0%.
 */
export interface RecoveryPoint {
  milestone: FollowUpMilestone;
  months: number;
  /** Completed assessments behind each rate. */
  continenceN: number;
  potencyN: number;
  /** Pad-free: dry, or occasional leakage without a pad. */
  continentPct: number | null;
  /** SHIM >= 17 (mild ED or better). */
  potentPct: number | null;
  meanPsa: number | null;
  bcrCount: number;
}

export interface SurgeonBenchmark {
  surgeon: SurgeonCode;
  caseload: number;
  continenceN: number;
  continenceRate: number | null;
  potencyN: number;
  potencyRate: number | null;
  histologyN: number;
  marginPositiveRate: number | null;
}

export interface RegistrySummary {
  patients: number;
  operations: number;
  completedFollowUps: number;
  overdueFollowUps: number;
  bcrEvents: number;
  marginPositiveRate: number | null;
}
