'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/api-client';
import { RecoveryPoint, SurgeonBenchmark, RegistrySummary } from '@/types/outcomes';

export function useOutcomes() {
  const [curve, setCurve] = useState<RecoveryPoint[]>([]);
  const [benchmark, setBenchmark] = useState<SurgeonBenchmark[]>([]);
  const [summary, setSummary] = useState<RegistrySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([db.getRecoveryCurve(), db.getSurgeonBenchmark(), db.getRegistrySummary()])
      .then(([c, b, s]) => {
        if (!active) return;
        setCurve(c);
        setBenchmark(b);
        setSummary(s);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load outcomes'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, []);

  return { curve, benchmark, summary, isLoading, error };
}
