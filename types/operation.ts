import { SurgeonCode } from './common';

export type BladderNeckStatus = 'sparing' | 'slight wide' | 'wide needing reconstruction';

export type NerveSparingSide = 'Bilateral' | 'Right' | 'Left' | 'None';

export type NerveSparingGrade = '2/5' | '3/5' | '4/5' | '5/5' | 'N/A';

export type SurgicalQualityGrade = 'Weak' | 'Good' | 'Excellent';

export interface OperationData {
  id?: string;
  patientId: string;
  surgeon: SurgeonCode;
  otherSurgeonName?: string;
  assistantName?: string;
  operationDate: string;
  bladderNeck: BladderNeckStatus;
  nerveSparing: NerveSparingSide;
  leftNerveSparingGrade: NerveSparingGrade;
  rightNerveSparingGrade: NerveSparingGrade;
  sphincter: SurgicalQualityGrade;
  anteriorReconstruction: SurgicalQualityGrade;
  posteriorReconstruction?: boolean;
  lymphNodeDissection: boolean;
  lymphNodeCount?: number;
  bloodLossMl: number; // 100 - 1500 ml
  durationMinutes: number; // mins
  consoleDurationMinutes?: number;
  robotType?: 'DaVinci Xi' | 'DaVinci X' | 'DaVinci Si' | 'Hugo RAS' | 'Versius';
  intraoperativeComplications?: string;
  catheterType?: string;
  drainPlaced?: boolean;
  drainInserted?: boolean;
  notes?: string;
  updatedAt?: string;
}
