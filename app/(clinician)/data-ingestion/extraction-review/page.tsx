'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { ExtractionTable } from '@/components/ingestion/extraction-table';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';

function ExtractionReviewContent() {
  const searchParams = useSearchParams();
  const { jobs, isLoading, error } = useIngestionJobs();
  const [selectedId, setSelectedId] = React.useState<string>('');

  // Only jobs awaiting a decision belong here; approved ones are done.
  const pending = jobs.filter((j) => j.status === 'review_required' || j.status === 'conflicted');

  const requested = searchParams.get('jobId');
  const currentJob =
    pending.find((j) => j.id === selectedId) ??
    pending.find((j) => j.id === requested) ??
    pending[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extraction Field Verification"
        description="Review extracted clinical fields from operation notes and letters before committing to the record"
        breadcrumbs={[
          { label: 'Data Ingestion', href: '/data-ingestion' },
          { label: 'Extraction Review' },
        ]}
        action={
          // Without this the page could only ever show the first job, leaving
          // every other document in the queue unreachable.
          pending.length > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {pending.length} awaiting review:
              </span>
              <Select
                value={currentJob?.id ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-72 text-xs"
              >
                {pending.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.conflictCount > 0 ? '⚠ ' : ''}
                    {j.documentTitle}
                  </option>
                ))}
              </Select>
            </div>
          ) : undefined
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{error}</div>
      )}

      {pending.some((j) => j.conflictCount > 0) && (
        <Badge variant="destructive" className="text-[11px]">
          {pending.filter((j) => j.conflictCount > 0).length} document(s) in the queue have an
          identity conflict
        </Badge>
      )}

      {isLoading ? (
        <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500 dark:bg-slate-900">
          Loading extraction queue…
        </div>
      ) : currentJob ? (
        <ExtractionTable job={currentJob} />
      ) : (
        <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500 dark:bg-slate-900">
          No extraction jobs pending review.
        </div>
      )}
    </div>
  );
}

export default function ExtractionReviewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading…</div>}>
      <ExtractionReviewContent />
    </Suspense>
  );
}
