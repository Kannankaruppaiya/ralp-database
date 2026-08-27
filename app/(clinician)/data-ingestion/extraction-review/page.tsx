'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { ExtractionTable } from '@/components/ingestion/extraction-table';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';

export default function ExtractionReviewPage() {
  const { jobs } = useIngestionJobs();
  const currentJob = jobs[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extraction Field Verification"
        description="Review AI-extracted clinical fields from operation notes & letters before committing to database"
        breadcrumbs={[
          { label: 'Data Ingestion', href: '/data-ingestion' },
          { label: 'Extraction Review' },
        ]}
      />

      {currentJob ? (
        <ExtractionTable job={currentJob} />
      ) : (
        <div className="p-12 text-center text-sm text-slate-500 rounded-xl border bg-white dark:bg-slate-900">
          No active extraction jobs pending review.
        </div>
      )}
    </div>
  );
}
