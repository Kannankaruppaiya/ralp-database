'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import { Role, ROLE_PERMISSIONS, UserRolePermissions } from '@/config/permissions';
import { SurgeonCode } from '@/types/common';
import { PatientFullRecord } from '@/types/patient';
import { db } from './api-client';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  surgeonCode?: SurgeonCode;
  gmcNumber?: string;
  hospital: string;
  /** Set only for role 'Patient' — the record this login may read. */
  patientId?: string;
}

/** Role permissions are static config, so this stays synchronous. */
export function getUserPermissions(role: Role): UserRolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['Consultant Surgeon'];
}

export async function signIn(email: string, password: string): Promise<UserSession> {
  const { data, error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const session = await loadProfile(data.user.id);
  if (!session) throw new Error('No profile is provisioned for this account.');
  await db.audit('LOGIN', undefined, `${session.name} signed in as ${session.role}`);
  return session;
}

export async function signOut(): Promise<void> {
  await db.audit('LOGOUT');
  await supabase().auth.signOut();
  profileCache.clear();
}

/**
 * In-flight and resolved profile lookups, keyed by user id.
 *
 * useSession is mounted by the sidebar, topbar, page body and any component
 * asking about permissions, and each mount would otherwise issue its own
 * identical profiles request on every page load. Sharing the promise collapses
 * them into one. Cleared on sign-out so a second login cannot read the first
 * user's profile.
 */
const profileCache = new Map<string, Promise<UserSession | null>>();

async function loadProfile(userId: string): Promise<UserSession | null> {
  const cached = profileCache.get(userId);
  if (cached) return cached;

  const pending = fetchProfile(userId);
  profileCache.set(userId, pending);
  // A failed lookup must not be cached, or the session stays broken until reload
  pending.then((p) => { if (!p) profileCache.delete(userId); }).catch(() => profileCache.delete(userId));
  return pending;
}

async function fetchProfile(userId: string): Promise<UserSession | null> {
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    role: data.role as Role,
    surgeonCode: data.surgeon_code ?? undefined,
    gmcNumber: data.gmc_number ?? undefined,
    hospital: data.hospital,
    patientId: data.patient_id ?? undefined,
  };
}

/**
 * Current signed-in user. Returns null while loading and after sign-out, so
 * callers must handle the null case rather than falling back to a default
 * identity — a wrong identity in a clinical audit trail is worse than none.
 */
export function useSession() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void supabase().auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      const session = data.user ? await loadProfile(data.user.id) : null;
      if (active) {
        setUser(session);
        setIsLoading(false);
      }
    });

    const { data: sub } = supabase().auth.onAuthStateChange(
      async (_event: string, session: { user?: { id: string } } | null) => {
        const next = session?.user ? await loadProfile(session.user.id) : null;
        if (active) setUser(next);
      }
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, permissions: user ? getUserPermissions(user.role) : null };
}

/** The patient portal's own record, resolved from the signed-in profile. */
export function useCurrentPatient() {
  const { user, isLoading: sessionLoading } = useSession();
  const [patient, setPatient] = useState<PatientFullRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user?.patientId) {
      setPatient(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    db.getPatientById(user.patientId)
      .then((p) => active && setPatient(p))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [user?.patientId, sessionLoading]);

  return { patient, isLoading: isLoading || sessionLoading };
}
