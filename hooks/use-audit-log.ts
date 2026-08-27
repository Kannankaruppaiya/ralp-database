'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/api-client';
import { AuditLogEntry } from '@/types/audit';

export function useAuditLog(limit = 200) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setEntries(await db.getAuditLogs(limit));
    } catch (e) {
      // Non-admins are denied by RLS — surface it rather than showing a blank table
      setError(e instanceof Error ? e.message : 'Failed to load audit trail');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, isLoading, error, refresh };
}
