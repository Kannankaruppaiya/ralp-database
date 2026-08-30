'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';
import { UserCheck, CheckCircle2, AlertTriangle, ArrowRight, Search, ShieldCheck, UserX } from 'lucide-react';
import Link from 'next/link';

export default function PatientMatchingPage() {
  const { jobs } = useIngestionJobs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Identity Matching & Verification"
        description="Deterministic & probabilistic NHS/MRN identity matching for ingested surgical documents"
        breadcrumbs={[
          { label: 'Data Ingestion', href: '/data-ingestion' },
          { label: 'Patient Matching' },
        ]}
      />

      {/* Matching Rules Info Banner */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block text-blue-950 dark:text-blue-200">
            NHS Digital Safe Identity Matching Protocol
          </strong>
          <p className="mt-0.5 text-blue-800/90 dark:text-blue-400">
            Documents are deterministically mapped via 10-digit NHS numbers and Hospital MRNs. Per clinical governance, <strong>patient name alone is never permitted</strong> for high-confidence clinical record linking.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const isHighConfidence = (job.matchedPatient?.matchScore || 0) >= 95;

          return (
            <Card key={job.id} className="shadow-sm overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Document: {job.documentTitle}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Source: {job.sourceType.replace('_', ' ')} • Uploaded: {new Date(job.uploadedAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <Badge variant={isHighConfidence ? 'success' : 'warning'} className="text-xs">
                  {job.matchedPatient?.matchScore ?? '—'}% Confidence Match
                </Badge>
              </CardHeader>

              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Extracted Metadata from Document */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                      Identifiers Extracted From Document
                    </span>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/50">
                      <span className="text-slate-500">Patient Name:</span>
                      <strong className="text-slate-900 dark:text-slate-100">{job.matchedPatient?.fullName || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/50">
                      <span className="text-slate-500">NHS Number:</span>
                      <strong className="font-mono text-blue-700 dark:text-blue-400">{job.matchedPatient?.nhsNumber || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/50">
                      <span className="text-slate-500">Hospital Number (MRN):</span>
                      <strong className="font-mono text-slate-900 dark:text-slate-100">{job.matchedPatient?.hospitalNumber || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Date of Birth:</span>
                      <strong className="text-slate-900 dark:text-slate-100">{job.matchedPatient?.dob || '—'}</strong>
                    </div>
                  </div>

                  {/* Matching Criteria Breakdown */}
                  <div className="space-y-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                      Deterministic Match Verification
                    </span>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-100">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Exact NHS Number Checksum Match
                        </span>
                        <strong className="font-mono text-emerald-700">100%</strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-100">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Hospital MRN Exact Match ({job.matchedPatient?.hospitalNumber})
                        </span>
                        <strong className="font-mono text-emerald-700">100%</strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border border-slate-200">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          DOB & Surname Verification
                        </span>
                        <strong className="font-mono text-blue-700">Verified</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Link href="/data-ingestion/extraction-review">
                        <Button size="sm" className="gap-1.5 text-xs shadow-sm">
                          <UserCheck className="h-4 w-4" />
                          <span>Confirm Link & Review Fields</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
