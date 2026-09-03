'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/api-client';
import { SurgeonCode } from '@/types/common';

export interface SurgeonOption {
  value: SurgeonCode;
  label: string;
  fullName: string;
}

/**
 * The surgeon roster, read from the database rather than a checked-in list.
 *
 * Replaces the old SURGEON_OPTIONS constant in config/clinical-options.ts:
 * a code appeared there only if someone had edited the file and redeployed,
 * so a newly provisioned consultant could hold an account but never be picked
 * as a patient's primary surgeon. See supabase/migrations/0012_surgeon_roster.sql.
 */
export function useSurgeons() {
  const [surgeons, setSurgeons] = useState<SurgeonOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    db.getSurgeonRoster()
      .then((rows) => {
        if (!live) return;
        setSurgeons(rows.map((r) => ({ value: r.code, label: r.code, fullName: r.fullName })));
        setError(null);
      })
      .catch((e) => {
        if (!live) return;
        // Render an empty picker over a stale hardcoded one: assigning a patient
        // to the wrong surgeon is worse than being unable to assign one yet.
        setSurgeons([]);
        setError(e instanceof Error ? e.message : 'Could not load the surgeon roster.');
      })
      .finally(() => live && setIsLoading(false));
    return () => { live = false; };
  }, []);

  /** Display name for a code, falling back to the code itself for a surgeon who has left. */
  const fullName = (code: SurgeonCode) =>
    surgeons.find((s) => s.value === code)?.fullName ?? code;

  return { surgeons, fullName, isLoading, error };
}
