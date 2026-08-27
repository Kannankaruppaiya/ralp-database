export type IncontinenceDayStatus = 
  | 'Completely dry, no pad'
  | 'Occasional leakage, no pad'
  | '1 pad/day'
  | '2 pads/day'
  | '>=3 pads/day';

export type IncontinenceNightPads = 0 | 1 | 2 | 3;

export type IPSSSeverity = 'Mild' | 'Moderate' | 'Severe';

export type SHIMSeverity = 'Severe ED' | 'Moderate ED' | 'Mild to Moderate ED' | 'Mild ED' | 'No ED';

export interface IPSSAnswers {
  incompleteEmptying: number; // 0 - 5
  frequency: number; // 0 - 5
  intermittency: number; // 0 - 5
  urgency: number; // 0 - 5
  weakStream: number; // 0 - 5
  straining: number; // 0 - 5
  nocturia: number; // 0 - 5
  qualityOfLife: number; // 0 (Delighted) - 6 (Terrible)
}

export interface IPSSScore {
  totalScore: number; // 0 - 35
  qualityOfLife: number; // 0 - 6
  severity: IPSSSeverity;
}

export interface SHIMAnswers {
  confidence: number; // 1 - 5
  firmness: number; // 0 - 5 (0 = No sexual activity)
  maintenanceFrequency: number; // 0 - 5
  maintenanceDifficulty: number; // 0 - 5
  satisfaction: number; // 0 - 5
}

export interface SHIMScore {
  totalScore: number; // 1 - 25
  severity: SHIMSeverity;
}

export interface ContinenceData {
  dayStatus: IncontinenceDayStatus;
  nightPads: IncontinenceNightPads;
  padSize?: 'Security shield / liner' | 'Standard pad' | 'Heavy / pull-up pants';
  botherScore?: number; // 0 (No bother) - 10 (Severe bother)
}

export interface PromSubmission {
  id?: string;
  patientId: string;
  milestone: 'baseline' | '6w' | '2m' | '6m' | '12m' | '18m' | '24m' | '30m' | '36m' | 'ad-hoc';
  completedAt: string;
  completedBy: 'patient' | 'clinician' | 'nurse';
  ipssAnswers?: IPSSAnswers;
  ipssScore?: IPSSScore;
  shimAnswers?: SHIMAnswers;
  shimScore?: SHIMScore;
  continence?: ContinenceData;
  notes?: string;
}
