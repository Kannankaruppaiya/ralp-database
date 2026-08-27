'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/api-client';
import { usePatients } from '@/hooks/use-patients';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminExportsPage() {
  const { toast } = useToast();
  const { allPatients } = usePatients({ fetchAll: true });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPatients, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `ralp_registry_full_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Actor identity is taken from the session server-side, not passed from here
    void db.audit(
      'DATA_EXPORT',
      undefined,
      `Full JSON registry snapshot downloaded (${allPatients.length} patient records)`
    );

    toast({
      title: 'Full Database Backup Generated',
      description: `Exported ${allPatients.length} full clinical records to JSON format.`,
      variant: 'default',
    });
  };

  const handleExportNpcaCsv = () => {
    const headers = [
      'NHS_Number',
      'Hospital_MRN',
      'Age',
      'Primary_Surgeon',
      'PreOp_PSA',
      'Biopsy_Gleason',
      'Clinical_Stage',
      'Surgery_Date',
      'Nerve_Sparing',
      'Pathological_Stage',
      'Histology_Gleason',
      'Surgical_Margins',
      '1yr_Continence_Pads',
      '1yr_SHIM_Score',
    ];

    const rows = allPatients.map((p) => {
      const fu12m = p.followUps.find((f) => f.milestone === '12m');
      return [
        p.nhsNumber,
        p.hospitalNumber,
        p.age,
        p.primarySurgeon,
        p.baseline?.psa || '',
        p.baseline?.gleasonGrade || '',
        p.baseline?.clinicalStage || '',
        p.operation?.operationDate || '',
        p.operation?.nerveSparing || '',
        p.histology?.pathologicalStage || '',
        p.histology?.gleasonGrade || '',
        p.histology?.surgicalMargins || '',
        fu12m?.continence?.dayStatus || 'Pending',
        fu12m?.shimScore?.totalScore ?? 'Pending',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(',')].concat(rows.map((r) => r.map((cell) => `"${cell}"`).join(','))).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `npca_annual_submission_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    void db.audit(
      'DATA_EXPORT',
      undefined,
      `NPCA submission dataset exported (${allPatients.length} records)`
    );

    toast({
      title: 'NPCA Dataset Exported',
      description: `Downloaded National Prostate Cancer Audit formatted CSV file.`,
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registry Data Exports & Backups"
        description="Generate Caldicott-governed datasets for NPCA (National Prostate Cancer Audit), BAUS registry, and complete database snapshots"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'Exports & Backups' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NPCA CSV Export */}
        <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="p-5 pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <Badge variant="success" className="text-[10px]">
                NPCA Schema v4.2
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-3">
              National Prostate Cancer Audit (NPCA) Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Standardized CSV extract containing pre-op risk stratification, surgical operative metrics, post-op histology, and 12-month trifecta functional outcomes.
            </p>
            <Button
              onClick={handleExportNpcaCsv}
              className="w-full gap-2 text-xs shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download NPCA CSV Extract</span>
            </Button>
          </CardContent>
        </Card>

        {/* Full Database JSON Backup */}
        <Card className="border-slate-200 bg-white shadow-sm flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="p-5 pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                <FileJson className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px]">
                Full JSON Schema
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-3">
              Complete Registry Database Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Full immutable JSON snapshot containing all patient records, baseline profiles, theatre logs, histology records, and complete longitudinal PROMs questionnaires.
            </p>
            <Button
              onClick={handleExportJson}
              variant="secondary"
              className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800 text-xs shadow-sm dark:bg-slate-100 dark:text-slate-900"
            >
              <Download className="h-4 w-4" />
              <span>Download Full JSON Database Snapshot</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
