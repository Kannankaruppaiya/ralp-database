'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/api-client';
import { FollowUpRecord } from '@/types/follow-up';
import { PatientFullRecord } from '@/types/patient';

export interface EnrichedFollowUp extends FollowUpRecord {
  patient: PatientFullRecord;
}

interface FollowUpBuckets {
  all: EnrichedFollowUp[];
  due: EnrichedFollowUp[];
  overdue: EnrichedFollowUp[];
  completed: EnrichedFollowUp[];
}

const EMPTY: FollowUpBuckets = { all: [], due: [], overdue: [], completed: [] };

/**
 * One query returns every follow-up joined to its patient; the four buckets are
 * split from that single result, so mounting several instances of this hook on
 * the same page does not multiply requests.
 */
export function useFollowUps(type?: 'all' | 'due' | 'overdue' | 'completed') {
  const [buckets, setBuckets] = useState<FollowUpBuckets>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await db.getFollowUps();
      const all = rows.map(({ followUp, patient }) => ({ ...followUp, patient }));
      setBuckets({
        all,
        due: all.filter((f) => f.status === 'due'),
        overdue: all.filter((f) => f.status === 'overdue'),
        completed: all.filter((f) => f.status === 'completed'),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load follow-ups');
      setBuckets(EMPTY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const followUps = useMemo(() => {
    switch (type) {
      case 'due': return buckets.due;
      case 'overdue': return buckets.overdue;
      case 'completed': return buckets.completed;
      default: return buckets.all;
    }
  }, [buckets, type]);

  return { followUps, isLoading, error, refresh, allBuckets: buckets };
}
