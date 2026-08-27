import { SurgeonCode, DataCompleteness } from './common';
import { BaselineCancerData } from './cancer';
import { OperationData } from './operation';
import { HistologyData } from './histology';
import { FollowUpRecord } from './follow-up';
import { PromSubmission } from './prom';

export interface PatientDemographics {
  id: string;
  firstName: string;
  surname: string;
  dateOfBirth: string; // ISO date YYYY-MM-DD
  age?: number;
  nhsNumber: string; // 10 digit formatted NHS number (e.g. 456 789 0123)
  hospitalNumber: string; // MRN (e.g. HOS-89421)
  phone?: string;
  email?: string;
  address?: string;
  postcode?: string;
  primarySurgeon: SurgeonCode;
  otherSurgeonName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientFullRecord extends PatientDemographics {
  baseline?: BaselineCancerData;
  operation?: OperationData;
  histology?: HistologyData;
  followUps: FollowUpRecord[];
  proms: PromSubmission[];
  completeness: DataCompleteness;
  status: 'Active' | 'Under Surveillance' | 'Discharged' | 'Deceased';
}
