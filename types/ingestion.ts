export interface ExtractedField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  category: 'Demographics' | 'Baseline Cancer' | 'Operation' | 'Histology' | 'Follow-up' | 'PROMs';
  rawValue: string;
  normalizedValue: any;
  confidence: number; // 0 - 100%
  status: 'exact' | 'inferred' | 'ambiguous' | 'conflicted';
  currentDbValue?: any;
  hasConflict: boolean;
  selectedSource?: 'extracted' | 'database' | 'custom';
  customValue?: any;
}

export interface PatientMatchCandidate {
  patientId: string;
  fullName: string;
  nhsNumber: string;
  hospitalNumber: string;
  dob: string;
  matchScore: number; // 0 - 100%
  matchReasons: string[];
}

export interface IngestionJob {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceType: 'word_document' | 'google_form_csv' | 'pdf' | 'clinic_letter' | 'theatre_note';
  status: 'uploaded' | 'extracting' | 'review_required' | 'conflicted' | 'approved' | 'rejected';
  matchedPatient?: PatientMatchCandidate;
  candidateMatches: PatientMatchCandidate[];
  extractedFields: ExtractedField[];
  conflictCount: number;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
