'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { db } from '@/lib/api-client';
import { Download, FileSpreadsheet, ShieldAlert, ShieldCheck, Database, TableProperties, History } from 'lucide-react';
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

  const schemaColumns = [
    { field: 'patient_pseudonym', type: 'VARCHAR(64)', pseudonym: 'Included (SHA-256)', identifiable: 'Excluded' },
    { field: 'nhs_number', type: 'VARCHAR(10)', pseudonym: 'REDACTED', identifiable: 'Plaintext (10-digit)' },
    { field: 'hospital_number', type: 'VARCHAR(20)', pseudonym: 'REDACTED', identifiable: 'Plaintext (MRN)' },
    { field: 'patient_name', type: 'VARCHAR(100)', pseudonym: 'REDACTED', identifiable: 'Plaintext Full Name' },
    { field: 'primary_surgeon', type: 'VARCHAR(4)', pseudonym: 'Surgeon Code (VK, RDM)', identifiable: 'Surgeon Code (VK, RDM)' },
    { field: 'biopsy_gleason', type: 'VARCHAR(10)', pseudonym: 'Clinical Grade', identifiable: 'Clinical Grade' },
    { field: 'ptnm_pathology', type: 'VARCHAR(20)', pseudonym: 'Pathology Stage', identifiable: 'Pathology Stage' },
    { field: 'prom_epicecp_12m', type: 'INTEGER', pseudonym: 'Functional Score', identifiable: 'Functional Score' },
  ];

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
        title="Registry Data Exports & National Submissions"
        description="Research extracts and national audit datasets generated according to Caldicott Principle 7"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'Exports' },
        ]}
      />

      <Tabs defaultValue="exports" className="space-y-6">
        <TabsList className="bg-[#181818] border border-[#272727]">
          <TabsTrigger value="exports">Data Export Gateways</TabsTrigger>
          <TabsTrigger value="schema">Caldicott Schema Specification</TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Pseudonymised Extract */}
            <Card className="flex flex-col justify-between border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
              <CardHeader className="border-b border-slate-100 dark:border-[#272727] p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border dark:border-emerald-900/60">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Badge variant="success" className="text-[10px]">No identifiers</Badge>
                </div>
                <CardTitle className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  Research &amp; Audit Extract
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5 flex flex-col flex-1">
                <p className="text-xs leading-relaxed text-slate-500 [text-wrap:pretty]">
                  Pre-operative risk, operative detail, histology and 12-month functional outcomes. Each
                  patient appears under a stable pseudonym, so records still link across submissions
                  without carrying an NHS number, hospital number, name or date of birth.
                </p>
                <div className="mt-auto pt-2">
                  <Button
                    onClick={() => void run('pseudonymised')}
                    disabled={busy !== null}
                    className="w-full gap-2 text-xs shadow-sm font-semibold"
                  >
                    <Download className="h-4 w-4" />
                    <span>{busy === 'pseudonymised' ? 'Generating…' : 'Download pseudonymised CSV'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Identifiable NPCA */}
            <Card className="flex flex-col justify-between border-rose-200 bg-white shadow-sm dark:border-rose-900/40 dark:bg-[#181818]">
              <CardHeader className="border-b border-slate-100 dark:border-[#272727] p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 dark:border dark:border-rose-900/60">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <Badge variant="destructive" className="text-[10px]">Identifiable</Badge>
                </div>
                <CardTitle className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  NPCA National Submission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5 flex flex-col flex-1">
                <p className="text-xs leading-relaxed text-slate-500 [text-wrap:pretty]">
                  The same clinical fields <strong>plus NHS number, hospital number, name and date of
                  birth</strong>, as the national audit requires for record linkage. The downloaded file
                  is identifiable patient data wherever it is saved, and the export is recorded in the
                  audit trail against your name.
                </p>

                <div className="mt-auto pt-2">
                  {confirmIdentifiable ? (
                    <div className="space-y-2 rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30 p-3">
                      <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                        Confirm you are exporting identifiable patient data under an agreed
                        information-sharing basis.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy !== null}
                          onClick={() => void run('identifiable')}
                          className="flex-1 text-xs font-semibold"
                        >
                          {busy === 'identifiable' ? 'Generating…' : 'Yes, export identifiable data'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmIdentifiable(false)}
                          className="text-xs font-semibold"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setConfirmIdentifiable(true)}
                      disabled={busy !== null}
                      variant="secondary"
                      className="w-full gap-2 text-xs shadow-sm font-semibold"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Prepare NPCA submission…</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-[#272727] dark:bg-[#181818]">
            <Table>
              <TableHeader className="bg-slate-50/90 dark:bg-[#121212]/90 backdrop-blur-sm">
                <TableRow className="border-b border-slate-200 dark:border-[#272727]">
                  <TableHead>Field Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Pseudonymised Extract</TableHead>
                  <TableHead>National NPCA Submission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemaColumns.map((col) => (
                  <TableRow key={col.field} className="hover:bg-slate-50/80 dark:hover:bg-[#1F1F1F]/60 border-b border-slate-100 dark:border-[#272727]">
                    <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {col.field}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {col.type}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {col.pseudonym.includes('REDACTED') ? (
                        <Badge variant="outline" className="text-[10px] text-slate-400">
                          {col.pseudonym}
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          {col.pseudonym}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {col.identifiable.includes('Plaintext') ? (
                        <Badge variant="destructive" className="text-[10px]">
                          {col.identifiable}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {col.identifiable}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
