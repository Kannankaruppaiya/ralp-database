export type Role = 'Consultant Surgeon' | 'Surgical Registrar' | 'Clinical Nurse Specialist' | 'Data Manager' | 'Patient';

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
  'Data Manager': {
    canViewClinicalRegistry: true,
    canEditClinicalData: true,
    canApproveExtractions: true,
    canViewSurgeonOutcomes: true,
    canManageUsers: true,
    canViewAuditLogs: true,
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
