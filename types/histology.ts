import { GleasonGrade, GradeGroup } from './cancer';

export type PathologicalStage = '2A' | '2B' | '2C' | '3A' | '3B' | '4';

export type MarginStatus = 'Negative (R0)' | 'Positive (R1)' | 'Uncertain (Rx)';

export interface HistologyData {
  id?: string;
  patientId: string;
  reportDate: string;
  pathologist?: string;
  specimenWeightGrams?: number;
  gleasonGrade: GleasonGrade;
  gradeGroup: GradeGroup;
  tertiaryPattern?: 'Pattern 4' | 'Pattern 5' | 'None';
  pathologicalStage: PathologicalStage;
  surgicalMargins: MarginStatus;
  positiveMarginLocations?: ('Apical' | 'Bladder Neck' | 'Posterolateral' | 'Anterior' | 'Base')[];
  marginLengthMm?: number;
  extraprostaticExtension: boolean; // EPE
  seminalVesicleInvasion: boolean; // SVI
  tumorVolumePercent?: number;
  lymphovascularInvasion?: boolean; // LVI
  lymphNodesExamined?: number;
  lymphNodesPositive?: number;
  notes?: string;
  updatedAt?: string;
}
