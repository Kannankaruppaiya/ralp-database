export const APP_STORAGE_KEYS = {
  PATIENTS: 'ralp_patients_v2',
  INGESTION_JOBS: 'ralp_ingestion_jobs_v2',
  DOCUMENTS: 'ralp_documents_v2',
  AUDIT_LOGS: 'ralp_audit_logs_v2',
  CURRENT_USER: 'ralp_current_user_v2',
  PATIENT_AUTH: 'ralp_patient_session_v2',
};

export const CLINICAL_THRESHOLDS = {
  BIOCHEMICAL_RECURRENCE_PSA: 0.2, // ng/mL
  UNDETECTABLE_PSA_THRESHOLD: 0.02, // ng/mL
  HIGH_RISK_PSA: 20.0,
  HIGH_RISK_GLEASON_SUM: 8,
};
