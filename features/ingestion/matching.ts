import { PatientMatchCandidate } from '@/types/ingestion';
import { PatientFullRecord } from '@/types/patient';

export function matchPatientFromText(text: string, patients: PatientFullRecord[]): PatientMatchCandidate | null {
  for (const p of patients) {
    const cleanNhs = p.nhsNumber.replace(/\s+/g, '');
    const cleanText = text.replace(/\s+/g, '');
    if (cleanText.includes(cleanNhs)) {
      return {
        patientId: p.id,
        fullName: `${p.firstName} ${p.surname}`,
        nhsNumber: p.nhsNumber,
        hospitalNumber: p.hospitalNumber,
        dob: p.dateOfBirth,
        matchScore: 100,
        matchReasons: ['Exact NHS number match'],
      };
    }
  }
  return null;
}
