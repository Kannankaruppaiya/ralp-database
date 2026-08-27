export type AuditAction = 
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'BASELINE_UPDATED'
  | 'OPERATION_LOGGED'
  | 'HISTOLOGY_LOGGED'
  | 'PROM_SUBMITTED'
  | 'FOLLOWUP_COMPLETED'
  | 'DOCUMENT_INGESTED'
  | 'CONFLICT_RESOLVED'
  | 'EXTRACTION_APPROVED'
  | 'CLINICAL_DATA_OVERRIDE'
  | 'DATA_EXPORT'
  | 'RECORD_EXPORTED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  gmcNumber?: string;
  patientId?: string;
  patientName?: string;
  resource?: string;
  action: AuditAction;
  details: string;
  ipAddress?: string;
  diff?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
