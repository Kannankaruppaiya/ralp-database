import { db } from '@/lib/api-client';
import { PatientDemographics } from '@/types/patient';

export const patientMutations = {
  createPatient: (patient: Partial<PatientDemographics>) => db.createPatient(patient),
  updatePatient: (id: string, patient: Partial<PatientDemographics>) =>
    db.updatePatient(id, patient),
};
