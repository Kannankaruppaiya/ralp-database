'use client';

import React, { useState } from 'react';
import { IngestionJob, ExtractedField } from '@/types/ingestion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, UserCheck, ShieldCheck, Check, X, FileText } from 'lucide-react';
import { db } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function ExtractionTable({ job }: { job: IngestionJob }) {
  const router = useRouter();
  const { toast } = useToast();
  const [fields, setFields] = useState<ExtractedField[]>(job.extractedFields);
  const [isApproving, setIsApproving] = useState(false);

  const handleToggleSource = (fieldId: string, source: 'extracted' | 'database') => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, selectedSource: source } : f))
    );
  };

  const handleApproveAll = async () => {
    setIsApproving(true);
    const targetPatientId = job.matchedPatient?.patientId;

    try {
      if (targetPatientId) {
        // Only the verified fields are written. Anything the reviewer left on
        // "database" keeps its stored value, so no untouched column is
        // overwritten by the extraction.
        const patch: Record<string, unknown> = {};
        fields.forEach((f) => {
          if (f.category === 'Operation' && f.selectedSource !== 'database') {
            patch[f.fieldKey] = f.normalizedValue;
          }
        });

        if (Object.keys(patch).length > 0) {
          await db.updateOperation(targetPatientId, patch);
        }

        await db.audit(
          'EXTRACTION_APPROVED',
          targetPatientId,
          `Approved ${fields.length} extracted fields from "${job.documentTitle}" and committed to the operative record`
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
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Match Card */}
      {job.matchedPatient && (
        <Card className="border-primary/30 bg-primary/10/40 dark:border-teal-900 dark:bg-teal-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground dark:text-slate-100">
                  Matched Patient: {job.matchedPatient.fullName}
                </h4>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>NHS: {job.matchedPatient.nhsNumber}</span>
                  <span>•</span>
                  <span>MRN: {job.matchedPatient.hospitalNumber}</span>
                  <span>•</span>
                  <span>DOB: {job.matchedPatient.dob}</span>
                </div>
              </div>
            </div>
            <Badge
              variant={job.conflictCount > 0 ? 'destructive' : 'success'}
              className="px-3 py-1 text-xs"
            >
              {job.matchedPatient.matchScore}% Match Confidence
            </Badge>
          </CardContent>
        </Card>
      )}

      {job.matchedPatient && job.matchedPatient.matchReasons.length > 0 && (
        <div
          className={`rounded-xl border p-4 text-xs ${
            job.conflictCount > 0
              ? 'border-destructive/20 bg-destructive/10 text-destructive'
              : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          <div className="mb-1.5 flex items-center gap-1.5 font-bold">
            {job.conflictCount > 0 && <AlertTriangle className="h-4 w-4" />}
            <span>{job.conflictCount > 0 ? 'Identity conflict' : 'How this patient was matched'}</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5">
            {job.matchedPatient.matchReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {job.conflictCount > 0 && (
            <p className="mt-2 font-semibold">
              Committing would write this document to a record it may not belong to. Confirm the
              patient&apos;s identity against the source document before approving.
            </p>
          )}
        </div>
      )}

      {/* Extracted Fields Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground dark:text-slate-100">
              Extracted Clinical Fields & Confidence
            </h3>
            <p className="text-xs text-muted-foreground">
              Verify values parsed from &ldquo;{job.documentTitle}&rdquo;
            </p>
          </div>
          <Button size="sm" onClick={() => void handleApproveAll()} disabled={isApproving} className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Approve & Commit to Registry</span>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Extracted Value</TableHead>
              <TableHead>Source Snippet</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Conflict / Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id} className={field.hasConflict ? 'bg-warning-muted/40 dark:bg-amber-950/20' : undefined}>
                <TableCell className="font-semibold text-xs text-foreground dark:text-slate-100">
                  {field.fieldLabel}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline">{field.category}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-primary dark:text-teal-400">
                  {String(field.normalizedValue)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate italic">
                  &ldquo;{field.rawValue}&rdquo;
                </TableCell>
                <TableCell>
                  <Badge variant={field.confidence >= 95 ? 'success' : 'warning'} className="text-[10px]">
                    {field.confidence}%
                  </Badge>
                </TableCell>
                <TableCell>
                  {field.hasConflict ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={field.selectedSource !== 'database' ? 'default' : 'outline'}
                        className="h-7 px-2 text-[11px]"
                        onClick={() => handleToggleSource(field.id, 'extracted')}
                      >
                        Keep Extracted ({field.normalizedValue})
                      </Button>
                      <Button
                        size="sm"
                        variant={field.selectedSource === 'database' ? 'default' : 'outline'}
                        className="h-7 px-2 text-[11px]"
                        onClick={() => handleToggleSource(field.id, 'database')}
                      >
                        Keep DB ({field.currentDbValue})
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-success-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> No conflict
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

export function ExtractionField() {
  return null;
}

export function PatientMatchPanel() {
  return null;
}

export function PatientMatchResults() {
  return null;
}

export function ConflictPanel() {
  return null;
}

export function ConflictValue() {
  return null;
}

export function ApprovalActions() {
  return null;
}
