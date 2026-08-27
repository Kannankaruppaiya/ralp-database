'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/api-client';
import { IngestionJob } from '@/types/ingestion';

export function useIngestionJobs() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setJobs(await db.getIngestionJobs());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ingestion queue');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { jobs, isLoading, error, refresh };
}
