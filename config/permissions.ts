export type Role =
  | 'Consultant Surgeon'
  | 'Surgical Registrar'
  | 'Clinical Nurse Specialist'
  | 'MDT Coordinator'
  | 'Caldicott Guardian'
  | 'Data Manager'
  | 'Research Auditor'
  | 'Patient';

export interface UserRolePermissions {
  canViewClinicalRegistry: boolean;
  canEditClinicalData: boolean;
  canApproveExtractions: boolean;
  canViewSurgeonOutcomes: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canSubmitProms: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, UserRolePermissions> = {
  'Consultant Surgeon': {
    canViewClinicalRegistry: true,
    canEditClinicalData: true,
    canApproveExtractions: true,
    canViewSurgeonOutcomes: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canSubmitProms: true,
  },
  'Surgical Registrar': {
    canViewClinicalRegistry: true,
    canEditClinicalData: true,
    canApproveExtractions: true,
    canViewSurgeonOutcomes: true,
    canManageUsers: false,
    canViewAuditLogs: false,
    canSubmitProms: true,
  },
  'Clinical Nurse Specialist': {
    canViewClinicalRegistry: true,
    canEditClinicalData: true,
    canApproveExtractions: true,
    canViewSurgeonOutcomes: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canSubmitProms: true,
  },
  'MDT Coordinator': {
    canViewClinicalRegistry: true,
    canEditClinicalData: true,
    canApproveExtractions: true,
    canViewSurgeonOutcomes: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canSubmitProms: false,
  },
  'Caldicott Guardian': {
    canViewClinicalRegistry: true,
    canEditClinicalData: false,
    canApproveExtractions: false,
    canViewSurgeonOutcomes: true,
    canManageUsers: false,
    canViewAuditLogs: true,
    canSubmitProms: false,
  },
  'Data Manager': {
    canViewClinicalRegistry: true,
    canEditClinicalData: true,
    canApproveExtractions: true,
    canViewSurgeonOutcomes: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canSubmitProms: false,
  },
  'Research Auditor': {
    canViewClinicalRegistry: true,
    canEditClinicalData: false,
    canApproveExtractions: false,
    canViewSurgeonOutcomes: true,
    canManageUsers: false,
    canViewAuditLogs: false,
    canSubmitProms: false,
  },
  'Patient': {
    canViewClinicalRegistry: false,
    canEditClinicalData: false,
    canApproveExtractions: false,
    canViewSurgeonOutcomes: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canSubmitProms: true,
  },
};
