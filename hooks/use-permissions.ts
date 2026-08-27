'use client';

import { useSession } from '@/lib/auth';

/** Thin view over the session for components that only care about capability. */
export function usePermissions() {
  const { user, permissions } = useSession();

  return {
    user,
    permissions,
    isClinician: !!user && user.role !== 'Patient',
    isSurgeon: user?.role === 'Consultant Surgeon',
  };
}
