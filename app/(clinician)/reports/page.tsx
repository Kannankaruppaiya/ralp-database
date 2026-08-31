'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Download, Users, BarChart3, ArrowRight } from 'lucide-react';
import { usePatients } from '@/hooks/use-patients';

export default function ReportsHubPage() {
  const { patients } = usePatients();

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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-teal-950 dark:text-teal-400">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground dark:text-slate-100">Clinic Summary Letters</h3>
              <p className="text-xs text-muted-foreground mt-1">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info-muted text-info-muted-foreground dark:bg-cyan-950 dark:text-cyan-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground dark:text-slate-100">Annual Outcomes Audit</h3>
              <p className="text-xs text-muted-foreground mt-1">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-category-muted text-category-muted-foreground dark:bg-purple-950 dark:text-purple-400">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground dark:text-slate-100">Data Registry Export</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Export anonymized patient registry CSV for national BAUS audit reporting.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs"
              onClick={() => {
                const json = JSON.stringify(patients, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `RALP_Registry_Export_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Full Registry (JSON)</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
