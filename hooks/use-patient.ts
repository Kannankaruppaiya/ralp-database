'use client';

import { useState, useEffect, useCallback } from 'react';
import { PatientFullRecord } from '@/types/patient';
import { db } from '@/lib/api-client';

export function usePatient(patientId: string) {
  const [patient, setPatient] = useState<PatientFullRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      setPatient(await db.getPatientById(patientId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load patient');
      setPatient(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { patient, isLoading, error, refresh };
}
