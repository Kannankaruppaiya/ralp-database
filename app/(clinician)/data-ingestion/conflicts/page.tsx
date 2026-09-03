'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/api-client';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';
import { ExtractedField, IngestionJob } from '@/types/ingestion';
import { ShieldAlert, CheckCircle2, FileText, ArrowRight, UserX } from 'lucide-react';

type Choice = 'extracted' | 'database';

/**
 * Reconciles a document against the record it was matched to.
 *
 * Every conflict shown here is a real disagreement detected at upload — an
 * extracted value that differs from what the patient's record already holds, or
 * a document naming a different person from the one its identifiers resolved
 * to. Nothing is written until a clinician chooses a side.
 */
export default function ConflictsPage() {
  const { jobs, isLoading, error, refresh } = useIngestionJobs();
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const conflicted = jobs.filter((j) => j.conflictCount > 0 && j.status === 'conflicted');

  const choiceFor = (jobId: string, f: ExtractedField): Choice =>
    choices[`${jobId}:${f.fieldKey}`] ?? 'extracted';

  async function resolve(job: IngestionJob) {
    setBusy(job.id);
    setSaveError(null);
    try {
      const patientId = job.matchedPatient?.patientId;
      if (!patientId) throw new Error('This document is not matched to a patient.');

      // Fields are partitioned by category so each resolution lands in the
      // correct clinical table. Previously only Operation-category fields were
      // written; Baseline, Histology, and Demographics resolutions were silently
      // dropped even after a clinician explicitly chose a side.
      const baselinePatch: Record<string, unknown> = {};
      const operationPatch: Record<string, unknown> = {};
      const histologyPatch: Record<string, unknown> = {};
      const demographicsPatch: Record<string, unknown> = {};

      job.extractedFields
        .filter((f) => f.hasConflict)
        .forEach((f) => {
          if (choiceFor(job.id, f) !== 'extracted') return;
          switch (f.category) {
            case 'Baseline Cancer':
              baselinePatch[f.fieldKey] = f.normalizedValue;
              break;
            case 'Operation':
              operationPatch[f.fieldKey] = f.normalizedValue;
              break;
            case 'Histology':
              histologyPatch[f.fieldKey] = f.normalizedValue;
              break;
            case 'Demographics':
              demographicsPatch[f.fieldKey] = f.normalizedValue;
              break;
          }
        });

      if (Object.keys(baselinePatch).length > 0) {
        await db.updateBaseline(patientId, baselinePatch);
      }
      if (Object.keys(operationPatch).length > 0) {
        await db.updateOperation(patientId, operationPatch);
      }
      if (Object.keys(histologyPatch).length > 0) {
        await db.updateHistology(patientId, histologyPatch);
      }
      if (Object.keys(demographicsPatch).length > 0) {
        await db.updatePatient(patientId, demographicsPatch);
      }

      const totalWritten =
        Object.keys(baselinePatch).length +
        Object.keys(operationPatch).length +
        Object.keys(histologyPatch).length +
        Object.keys(demographicsPatch).length;

      await db.saveIngestionJob({ ...job, status: 'approved', conflictCount: 0 });
      await db.audit(
        'CONFLICT_RESOLVED',
        patientId,
        `Reconciled ${job.conflictCount} discrepancy(ies) in "${job.documentTitle}"; ` +
          `${totalWritten} field(s) taken from the document.`
      );
      await refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not apply the resolution.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extraction Conflict Resolution"
        description="Where an incoming document disagrees with the registry, side by side"
        breadcrumbs={[{ label: 'Data Ingestion', href: '/data-ingestion' }, { label: 'Conflicts' }]}
      />

      {(error || saveError) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error ?? saveError}
        </div>
      )}

      {isLoading ? (
        <Card className="p-12 text-center text-sm text-slate-500">Loading conflicts…</Card>
      ) : conflicted.length === 0 ? (
        <Card className="bg-white p-8 text-center dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No outstanding discrepancies
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Documents whose values agree with the record go straight to extraction review.
          </p>
        </Card>
      ) : (
        conflicted.map((job) => {
          const fieldConflicts = job.extractedFields.filter((f) => f.hasConflict);
          const identityIssue = job.matchedPatient?.matchReasons.find((r) => r.startsWith('NAME MISMATCH'));

          return (
            <Card key={job.id} className="overflow-hidden border-rose-200 shadow-sm">
              <CardHeader className="flex flex-col gap-2 border-b bg-rose-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <span>{job.documentTitle}</span>
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {job.matchedPatient
                      ? `Matched to ${job.matchedPatient.fullName} (NHS ${job.matchedPatient.nhsNumber})`
                      : 'No patient matched'}
                  </p>
                </div>
                <Badge variant="destructive" className="text-[10px]">
                  {job.conflictCount} conflict{job.conflictCount === 1 ? '' : 's'}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4 p-5">
                {identityIssue && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
                    <UserX className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-bold">Identity conflict</div>
                      <p>{identityIssue}</p>
                      <p className="mt-1">
                        Resolve this before any field is committed — the identifiers may have been
                        mistyped, in which case the document belongs to a different record entirely.
                      </p>
                    </div>
                  </div>
                )}

                {fieldConflicts.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No field-level disagreements; the only issue is the identity match above.
                  </p>
                ) : (
                  fieldConflicts.map((f) => {
                    const chosen = choiceFor(job.id, f);
                    return (
                      <div key={f.fieldKey} className="rounded-xl border p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {f.fieldLabel}
                          </span>
                          <span className="text-[11px] text-slate-400">{f.category}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {([
                            ['extracted', 'From the document', f.normalizedValue, f.rawValue],
                            ['database', 'Currently in the record', f.currentDbValue, undefined],
                          ] as [Choice, string, unknown, string | undefined][]).map(
                            ([key, title, value, raw]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setChoices((c) => ({ ...c, [`${job.id}:${f.fieldKey}`]: key }))}
                                className={`rounded-lg border p-3 text-left transition-colors ${
                                  chosen === key
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                                }`}
                              >
                                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  {key === 'extracted' && <FileText className="h-3 w-3" />}
                                  <span>{title}</span>
                                </div>
                                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {String(value ?? '—')}
                                </div>
                                {raw && (
                                  <div className="mt-1 text-[11px] italic text-slate-400">“{raw}”</div>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Link
                    href={`/data-ingestion/extraction-review?jobId=${job.id}`}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    View all extracted fields <ArrowRight className="inline h-3 w-3" />
                  </Link>
                  <Button
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => void resolve(job)}
                    className="text-xs"
                  >
                    {busy === job.id ? 'Applying…' : 'Apply resolution'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
