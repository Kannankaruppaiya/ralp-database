'use client';

import { useState, useEffect, useCallback } from 'react';
import { PatientFullRecord } from '@/types/patient';
import { db } from '@/lib/api-client';
import { SurgeonCode } from '@/types/common';
import { useDebounce } from '@/hooks/use-debounce';

export interface UsePatientsFilters {
  searchQuery?: string;
  surgeon?: SurgeonCode | 'ALL';
  stage?: string | 'ALL';
  status?: string | 'ALL';
  completenessMin?: number;
  pageSize?: number;
  /** Aggregate views (dashboard tiles, registry export) that need every row. */
  fetchAll?: boolean;
}

const DEFAULT_PAGE_SIZE = 25;
// ponytail: whole-registry reads are capped rather than cursor-paged. Move the
// dashboard tiles to a SQL aggregate RPC if the registry outgrows this.
const FETCH_ALL_LIMIT = 10000;

export function usePatients(filters?: UsePatientsFilters) {
  const [patients, setPatients] = useState<PatientFullRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(filters?.pageSize || DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (filters?.pageSize) setPageSize(filters.pageSize);
  }, [filters?.pageSize]);

  // Only query after the user stops typing — one request per search, not one per key.
  const debouncedSearch = useDebounce(filters?.searchQuery ?? '', 300);
  const fetchAll = filters?.fetchAll ?? false;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await db.getPatients({
        search: debouncedSearch,
        surgeon: filters?.surgeon,
        stage: filters?.stage,
        status: filters?.status,
        page: fetchAll ? 1 : page,
        pageSize: fetchAll ? FETCH_ALL_LIMIT : pageSize,
      });
      const rows = filters?.completenessMin !== undefined
        ? result.patients.filter((p) => p.completeness.score >= filters.completenessMin!)
        : result.patients;
      setPatients(rows);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load patients');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch, filters?.surgeon, filters?.stage, filters?.status,
    filters?.completenessMin, page, pageSize, fetchAll,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A changed filter invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters?.surgeon, filters?.stage, filters?.status, filters?.completenessMin]);

  return {
    patients,
    allPatients: patients,
    filteredCount: total,
    isLoading,
    error,
    refresh,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    setPage,
    pageSize,
    setPageSize,
    PAGE_SIZE: pageSize,
  };
}
