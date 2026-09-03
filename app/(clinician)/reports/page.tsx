'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, BarChart3, ArrowRight, Loader2 } from 'lucide-react';
import { db } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

/** Converts an array of flat objects to a UTF-8 CSV string. */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

export default function ReportsHubPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // exportPseudonymised() reads from the registry_export_pseudonymised DB
      // view (no NHS number, no name, no date of birth) and writes an
      // EXPORT_PSEUDONYMISED audit event — both happen inside the function.
      const rows = await db.exportPseudonymised();
      if (rows.length === 0) {
        toast({
          title: 'No records to export',
          description: 'The registry contains no data yet.',
          variant: 'default',
        });
        return;
      }
      const csv = toCsv(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RALP_Registry_Pseudonymised_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Export complete',
        description: `${rows.length} records exported. Audit event recorded.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Unexpected error.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Reports & MDT Summaries"
        description="Generate printable clinic summaries, multidisciplinary team letters, and audit export datasets"
        breadcrumbs={[{ label: 'Reports Hub' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:border-teal-500 transition-colors">
          <CardContent className="p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Clinic Summary Letters</h3>
              <p className="text-xs text-slate-500 mt-1">
                Standard NHS printable clinic summary containing full surgical, histology, and 7-milestone PROM matrix.
              </p>
            </div>
            <Link href="/reports/clinic-summary" className="block">
              <Button size="sm" className="w-full gap-1.5 text-xs">
                <span>Open Clinic Summary</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:border-cyan-500 transition-colors">
          <CardContent className="p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Annual Outcomes Audit</h3>
              <p className="text-xs text-slate-500 mt-1">
                Trifecta & Pentafecta surgical quality report benchmarked across VK, RDM, CI, and OAK.
              </p>
            </div>
            <Link href="/analytics" className="block">
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                <span>View Analytics Audit</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:border-purple-500 transition-colors">
          <CardContent className="p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Data Registry Export</h3>
              <p className="text-xs text-slate-500 mt-1">
                Export pseudonymised patient registry CSV for national BAUS audit reporting.
                No NHS number, name, or date of birth is included. Export is Caldicott-audited.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs"
              disabled={isExporting}
              onClick={() => void handleExport()}
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{isExporting ? 'Exporting…' : 'Export Pseudonymised Registry (CSV)'}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


