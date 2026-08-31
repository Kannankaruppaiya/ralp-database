'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/api-client';
import { Download, FileSpreadsheet, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/** RFC 4180 quoting — a free-text note containing a comma must not split a row. */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const cell = (v: unknown) =>
    v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`;
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => cell(r[h])).join(',')),
  ].join('\n');
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminExportsPage() {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmIdentifiable, setConfirmIdentifiable] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  async function run(kind: 'pseudonymised' | 'identifiable') {
    setBusy(kind);
    try {
      const rows =
        kind === 'pseudonymised' ? await db.exportPseudonymised() : await db.exportIdentifiable();

      if (rows.length === 0) {
        toast({ title: 'Nothing to export', description: 'The registry is empty.', variant: 'destructive' });
        return;
      }

      download(
        kind === 'pseudonymised'
          ? `ralp_research_extract_${today}.csv`
          : `npca_submission_IDENTIFIABLE_${today}.csv`,
        toCsv(rows)
      );

      toast({
        title: `${rows.length} records exported`,
        description:
          kind === 'pseudonymised'
            ? 'No NHS numbers, hospital numbers, names or dates of birth are in this file.'
            : 'This file contains identifiable patient data. Handle it accordingly.',
        variant: kind === 'pseudonymised' ? 'success' : 'destructive',
      });
    } catch (e) {
      toast({
        title: 'Export failed',
        description: e instanceof Error ? e.message : 'Unexpected error.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
      setConfirmIdentifiable(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registry Data Exports"
        description="Research extracts and national audit submissions, generated from the database"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'Exports' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ---------------------------------------------- pseudonymised */}
        <Card className="flex flex-col justify-between border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-muted text-success-muted-foreground dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <Badge variant="success" className="text-[10px]">No identifiers</Badge>
            </div>
            <CardTitle className="mt-3 text-base font-bold text-foreground dark:text-white">
              Research &amp; Audit Extract
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pre-operative risk, operative detail, histology and 12-month functional outcomes. Each
              patient appears under a stable pseudonym, so records still link across submissions
              without carrying an NHS number, hospital number, name or date of birth.
            </p>
            <Button
              onClick={() => void run('pseudonymised')}
              disabled={busy !== null}
              className="w-full gap-2 text-xs shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>{busy === 'pseudonymised' ? 'Generating…' : 'Download pseudonymised CSV'}</span>
            </Button>
          </CardContent>
        </Card>

        {/* ---------------------------------------------- identifiable */}
        <Card className="flex flex-col justify-between border-destructive/20 bg-card shadow-sm dark:border-rose-900/50 dark:bg-slate-900">
          <CardHeader className="border-b p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive dark:bg-rose-950 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <Badge variant="destructive" className="text-[10px]">Identifiable</Badge>
            </div>
            <CardTitle className="mt-3 text-base font-bold text-foreground dark:text-white">
              NPCA National Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              The same clinical fields <strong>plus NHS number, hospital number, name and date of
              birth</strong>, as the national audit requires for record linkage. The downloaded file
              is identifiable patient data wherever it is saved, and the export is recorded in the
              audit trail against your name.
            </p>

            {confirmIdentifiable ? (
              <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-[11px] font-semibold text-destructive">
                  Confirm you are exporting identifiable patient data under an agreed
                  information-sharing basis.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy !== null}
                    onClick={() => void run('identifiable')}
                    className="flex-1 text-xs"
                  >
                    {busy === 'identifiable' ? 'Generating…' : 'Yes, export identifiable data'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmIdentifiable(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // Two steps deliberately: an identifiable export should not be one
              // click away from a page someone opened to look around.
              <Button
                onClick={() => setConfirmIdentifiable(true)}
                disabled={busy !== null}
                variant="secondary"
                className="w-full gap-2 text-xs shadow-sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Prepare NPCA submission…</span>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Both exports are written to the Caldicott audit trail under distinct actions, so an
        identifiable extract is always distinguishable from a pseudonymised one after the fact.
      </p>
    </div>
  );
}
