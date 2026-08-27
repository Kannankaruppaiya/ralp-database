export type GleasonGrade = '3+3' | '3+4' | '4+3' | '4+4' | '4+5' | '5+4' | '5+5';

export type GradeGroup = 1 | 2 | 3 | 4 | 5;

export type ClinicalStage = '2A' | '2B' | '2C' | '3A' | '3B' | '4';

export interface BaselineCancerData {
  id?: string;
  patientId: string;
  psa: number; // ng/mL
  psaDate?: string;
  gleasonGrade: GleasonGrade;
  gradeGroup: GradeGroup;
  percentPositiveCoresWorst: number; // 1 - 100%
  percentPositiveCoresBest: number; // 1 - 100%
  ukbScore: number; // 1 - 100
  clinicalStage: ClinicalStage;
  mriPIRADS?: 1 | 2 | 3 | 4 | 5;
  prostateVolumeCc?: number;
  biopsyDate?: string;
  notes?: string;
  updatedAt?: string;
}
