'use client';

import React, { useState } from 'react';
import { IngestionJob, ExtractedField } from '@/types/ingestion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Check,
  X,
  FileText,
  AlertOctagon,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { db } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function ExtractionTable({ job }: { job: IngestionJob }) {
  const router = useRouter();
  const { toast } = useToast();
  const [fields, setFields] = useState<ExtractedField[]>(job.extractedFields);
  const [isApproving, setIsApproving] = useState(false);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  const hasIdentityConflict = job.conflictCount > 0;
  const hasFieldConflicts = fields.some((f) => f.hasConflict);

  const handleToggleSource = (fieldId: string, source: 'extracted' | 'database') => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, selectedSource: source } : f))
    );
  };

  const handleApproveAll = async () => {
    if (hasIdentityConflict && !conflictAcknowledged) {
      toast({
        title: 'Identity conflict unacknowledged',
        description: 'Please review and explicitly confirm the patient identity match before committing.',
        variant: 'destructive',
      });
      return;
    }

    setIsApproving(true);
    const targetPatientId = job.matchedPatient?.patientId;

    try {
      if (targetPatientId) {
        // Only verified fields are written. Anything the reviewer left on
        // "database" keeps its stored value. Fields are partitioned by category
        // so each section lands in the correct clinical table — previously only
        // Operation fields were written; Baseline, Histology, and Demographics
        // were silently dropped.
        const baselinePatch: Record<string, unknown> = {};
        const operationPatch: Record<string, unknown> = {};
        const histologyPatch: Record<string, unknown> = {};
        const demographicsPatch: Record<string, unknown> = {};

        fields.forEach((f) => {
          if (f.selectedSource === 'database') return;
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
            // Follow-up and PROMs are not committed via the ingestion pipeline
          }
        });

        if (Object.keys(baselinePatch).length > 0) {
          await db.updateBaseline(targetPatientId, baselinePatch);
        }
        if (Object.keys(operationPatch).length > 0) {
          await db.updateOperation(targetPatientId, operationPatch);
        }
        if (Object.keys(histologyPatch).length > 0) {
          await db.updateHistology(targetPatientId, histologyPatch);
        }
        if (Object.keys(demographicsPatch).length > 0) {
          await db.updatePatient(targetPatientId, demographicsPatch);
        }

        const sections = [
          Object.keys(baselinePatch).length > 0 && 'Baseline',
          Object.keys(operationPatch).length > 0 && 'Operation',
          Object.keys(histologyPatch).length > 0 && 'Histology',
          Object.keys(demographicsPatch).length > 0 && 'Demographics',
        ].filter(Boolean).join(', ');

        await db.audit(
          'EXTRACTION_APPROVED',
          targetPatientId,
          `Approved ${fields.length} extracted fields from "${job.documentTitle}" and committed to: ${sections || 'no sections'}`
        );
      }

      await db.saveIngestionJob({ ...job, status: 'approved' });
      setIsApproving(false);

      toast({
        title: 'Extraction Approved & Committed',
        description: 'Verified clinical fields successfully added to patient record.',
        variant: 'success',
      });

      router.push(targetPatientId ? `/patients/${targetPatientId}/operation` : '/patients');
    } catch (err) {
      setIsApproving(false);
      toast({
        title: 'Could not commit extraction',
        description: err instanceof Error ? err.message : 'Unexpected error during commit.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* High-Consequence Conflict Banner */}
      {hasIdentityConflict && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50/90 dark:bg-rose-950/40 p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
              <AlertOctagon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Critical Safety Alert: Patient Identity Mismatch
                </h3>
                <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                  {job.conflictCount} Conflict{job.conflictCount > 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                The extracted document identifiers differ from the matched patient record. Committing without verification risks attaching surgical notes to the wrong clinical dossier.
              </p>
              
              <ul className="mt-2 text-xs font-semibold text-rose-900 dark:text-rose-200 list-disc list-inside space-y-0.5">
                {job.matchedPatient?.matchReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-rose-950 dark:text-rose-200 cursor-pointer">
              <input
                type="checkbox"
                checked={conflictAcknowledged}
                onChange={(e) => setConflictAcknowledged(e.target.checked)}
                className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
              <span>I have verified against the original physical letterhead that this document belongs to {job.matchedPatient?.fullName}</span>
            </label>
          </div>
        </div>
      )}

      {/* Matched Patient & Source Document Card */}
      {job.matchedPatient && (
        <Card className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Patient:</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {job.matchedPatient.fullName}
                  </h4>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 font-mono [font-variant-numeric:tabular-nums]">
                  <span>NHS: <strong>{job.matchedPatient.nhsNumber}</strong></span>
                  <span>•</span>
                  <span>MRN: <strong>{job.matchedPatient.hospitalNumber}</strong></span>
                  <span>•</span>
                  <span>DOB: {job.matchedPatient.dob}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Match Algorithm</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono [font-variant-numeric:tabular-nums]">
                  {job.matchedPatient.matchScore}% Confidence
                </span>
              </div>
              <Badge
                variant={job.conflictCount > 0 ? 'destructive' : 'success'}
                className="px-3 py-1 text-xs"
              >
                {job.conflictCount > 0 ? 'Identity Flag' : 'Verified Match'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Fields Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Extracted Clinical Fields ({fields.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Document: <strong className="text-slate-800 dark:text-slate-200">&ldquo;{job.documentTitle}&rdquo;</strong>
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => void handleApproveAll()}
            isLoading={isApproving}
            disabled={hasIdentityConflict && !conflictAcknowledged}
            className={`gap-1.5 font-bold text-xs shadow-sm ${
              hasIdentityConflict && !conflictAcknowledged
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Approve & Commit to Registry</span>
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/90">
            <TableRow>
              <TableHead>Clinical Field</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Extracted Value</TableHead>
              <TableHead>Raw Source Text</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="text-right">Reconciliation Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id} className={field.hasConflict ? 'bg-amber-50/40 dark:bg-amber-950/20' : undefined}>
                <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  {field.fieldLabel}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">{field.category}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300 [font-variant-numeric:tabular-nums]">
                  {String(field.normalizedValue)}
                </TableCell>
                <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate italic">
                  &ldquo;{field.rawValue}&rdquo;
                </TableCell>
                <TableCell>
                  <Badge variant={field.confidence >= 95 ? 'success' : 'warning'} className="text-[10px] font-mono [font-variant-numeric:tabular-nums]">
                    {field.confidence}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {field.hasConflict ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={field.selectedSource !== 'database' ? 'default' : 'outline'}
                        className="h-7 px-2.5 text-[11px] font-semibold"
                        onClick={() => handleToggleSource(field.id, 'extracted')}
                      >
                        Keep Extracted ({field.normalizedValue})
                      </Button>
                      <Button
                        size="sm"
                        variant={field.selectedSource === 'database' ? 'default' : 'outline'}
                        className="h-7 px-2.5 text-[11px] font-semibold"
                        onClick={() => handleToggleSource(field.id, 'database')}
                      >
                        Keep Stored ({field.currentDbValue})
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Consistent</span>
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


