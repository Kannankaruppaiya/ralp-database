'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/api-client';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';
import { ShieldAlert, CheckCircle2, FileText, Database, ArrowRight, UserCheck, Save } from 'lucide-react';
import Link from 'next/link';

export default function ConflictsPage() {
  const { jobs, refresh } = useIngestionJobs();
  const conflictedJobs = jobs.filter((j) => j.conflictCount > 0);

  // Selected values for reconciliation
  const [resolutions, setResolutions] = useState<Record<string, { choice: 'extracted' | 'database' | 'custom'; customVal?: string; rationale?: string }>>({
    'job-002-field-ebl': { choice: 'extracted', rationale: 'Operation theatre note is the primary source of truth for intra-op blood loss.' },
  });

  const [resolvedJobs, setResolvedJobs] = useState<string[]>([]);

  const handleResolveJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    // Only the reconciled field is written; the rest of the operation record
    // is left as it stands.
    if (job.matchedPatient) {
      await db.updateOperation(job.matchedPatient.patientId, { bloodLossMl: 250 });
    }

    await db.saveIngestionJob({ ...job, conflictCount: 0, status: 'approved' });
    await db.audit(
      'CONFLICT_RESOLVED',
      job.matchedPatient?.patientId,
      `Reconciled blood loss discrepancy in ${job.documentTitle}. Selected: Operation Note (250 ml). Reason: Primary intraoperative surgical record.`
    );

    setResolvedJobs((prev) => [...prev, jobId]);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extraction Conflict Resolution Hub"
        description="Side-by-side clinical reconciliation when incoming documents disagree with existing registry data"
        breadcrumbs={[
          { label: 'Data Ingestion', href: '/data-ingestion' },
          { label: 'Conflicts' },
        ]}
      />

      {conflictedJobs.length === 0 ? (
        <Card className="p-8 text-center bg-white dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">All Discrepancies Reconciled</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No conflicting clinical data points currently exist between OCR extracted documents and the surgical database.
          </p>
          <div className="mt-4">
            <Link href="/data-ingestion">
              <Button size="sm" variant="outline">Back to Data Ingestion</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {conflictedJobs.map((job) => {
            const conflictKey = 'job-002-field-ebl';
            const currentResolution = resolutions[conflictKey] || { choice: 'extracted' };

            return (
              <Card key={job.id} className="border-amber-200 bg-white shadow-md dark:border-amber-900/50 dark:bg-slate-900 overflow-hidden">
                <CardHeader className="bg-amber-50/50 p-5 border-b border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Discrepancy: Estimated Blood Loss (EBL)
                      </CardTitle>
                      <Badge variant="warning" className="text-[10px]">1 Conflict</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Document: <strong>{job.documentTitle}</strong> • Matched to Patient: <strong>{job.matchedPatient?.fullName}</strong> (NHS: {job.matchedPatient?.nhsNumber})
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => void handleResolveJob(job.id)}
                    className="gap-1.5 bg-teal-600 hover:bg-teal-700 shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Apply Resolution & Update Audit</span>
                  </Button>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Side by side comparison cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Source A: Extracted Document */}
                    <div
                      onClick={() => setResolutions((prev) => ({ ...prev, [conflictKey]: { ...currentResolution, choice: 'extracted' } }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        currentResolution.choice === 'extracted'
                          ? 'border-teal-600 bg-teal-50/30 dark:bg-teal-950/20 ring-2 ring-teal-600/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-teal-600" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Source 1: Extracted Theatre Note
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="choice"
                          checked={currentResolution.choice === 'extracted'}
                          onChange={() => {}}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                      </div>
                      <div className="text-2xl font-bold text-teal-950 dark:text-teal-100 font-mono">
                        250 mL
                      </div>
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Raw Text: &ldquo;Estimated blood loss was measured at approximately 250ml intra-operatively.&rdquo;
                      </p>
                      <Badge variant="success" className="mt-3 text-[10px]">
                        Primary Surgical Record (98% Confidence)
                      </Badge>
                    </div>

                    {/* Source B: Existing DB Record */}
                    <div
                      onClick={() => setResolutions((prev) => ({ ...prev, [conflictKey]: { ...currentResolution, choice: 'database' } }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        currentResolution.choice === 'database'
                          ? 'border-teal-600 bg-teal-50/30 dark:bg-teal-950/20 ring-2 ring-teal-600/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-slate-600" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Source 2: Current Database Record
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="choice"
                          checked={currentResolution.choice === 'database'}
                          onChange={() => {}}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                        300 mL
                      </div>
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Entered via: Clinic Follow-up Letter Summary (12 Aug 2026)
                      </p>
                      <Badge variant="outline" className="mt-3 text-[10px]">
                        Secondary Clinical Summary
                      </Badge>
                    </div>
                  </div>

                  {/* Clinician Rationale Note */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Clinical Audit Rationale (NHS Caldicott / Information Governance Mandatory Log):
                    </label>
                    <Input
                      value={currentResolution.rationale || ''}
                      onChange={(e) =>
                        setResolutions((prev) => ({
                          ...prev,
                          [conflictKey]: { ...currentResolution, rationale: e.target.value },
                        }))
                      }
                      placeholder="e.g. Theatre operative note represents direct surgeon observation; chosen over clinic letter recap."
                      className="text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
