'use client';

import { useEffect, useState } from 'react';
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
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? 'Sign in failed.');

  const session = body.user as UserSession;
  setSession(session);
  await db.audit('LOGIN', undefined, `${session.name} signed in as ${session.role}`);
  return session;
}

export async function signOut(): Promise<void> {
  await db.audit('LOGOUT');
  await fetch('/api/auth/logout', { method: 'POST' });
  setSession(null);
}

/**
 * A single shared view of "who is signed in", so the sidebar, topbar, page body
 * and any permissions check do not each fetch the session. The promise is
 * fetched once and shared; sign-in and sign-out update it and notify every
 * mounted useSession.
 */
let sessionPromise: Promise<UserSession | null> | null = null;
const listeners = new Set<(s: UserSession | null) => void>();

function fetchSession(): Promise<UserSession | null> {
  return fetch('/api/auth/session')
    .then((r) => (r.ok ? r.json() : { user: null }))
    .then((b) => (b.user as UserSession | null) ?? null)
    .catch(() => null);
}

function loadSession(): Promise<UserSession | null> {
  if (!sessionPromise) sessionPromise = fetchSession();
  return sessionPromise;
}

function setSession(session: UserSession | null) {
  sessionPromise = Promise.resolve(session);
  listeners.forEach((fn) => fn(session));
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
    const onChange = (s: UserSession | null) => { if (active) setUser(s); };
    listeners.add(onChange);

    loadSession().then((s) => {
      if (!active) return;
      setUser(s);
      setIsLoading(false);
    });

    return () => { active = false; listeners.delete(onChange); };
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
