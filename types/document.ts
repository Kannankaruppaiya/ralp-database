export type DocumentType = 
  | 'Theatre Operation Note'
  | 'Post-Op Histology Report'
  | 'Clinic Follow-up Letter'
  | 'MDT Summary'
  | 'Patient Questionnaire Form'
  | 'Other';

export interface ClinicalDocument {
  id: string;
  patientId?: string;
  patientName?: string;
  nhsNumber?: string;
  hospitalNumber?: string;
  title: string;
  docType: DocumentType;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  rawText?: string;
  parsedStatus: 'pending' | 'parsed' | 'reviewed' | 'rejected';
  confidenceScore?: number; // 0 - 100%
  extractedFieldCount?: number;
}
