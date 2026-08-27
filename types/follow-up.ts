import { ContinenceData, IPSSScore, SHIMScore } from './prom';

export type FollowUpMilestone = '6w' | '2m' | '6m' | '12m' | '18m' | '24m' | '30m' | '36m';

export type FollowUpStatus = 'scheduled' | 'due' | 'overdue' | 'completed' | 'missed';

export interface FollowUpRecord {
  id: string;
  patientId: string;
  milestone: FollowUpMilestone;
  targetMonths: number;
  dueDate: string; // ISO date
  completedDate?: string;
  status: FollowUpStatus;
  psa?: number; // ng/mL post-op (undetectable is <0.01 or <0.02)
  psaDate?: string;
  isUndetectablePsa?: boolean;
  biochemicalRecurrence?: boolean; // PSA >= 0.2
  ipssScore?: IPSSScore;
  shimScore?: SHIMScore;
  continence?: ContinenceData;
  promSubmitted: boolean;
  consultationType?: 'Face to Face' | 'Telephone' | 'Video' | 'Remote Digital Questionnaire';
  clinicalNotes?: string;
  notes?: string;
  adjuvantTherapy?: 'None' | 'Salvage Radiotherapy' | 'Hormone Therapy (ADT)' | 'Systemic';
  clinicianName?: string;
}
