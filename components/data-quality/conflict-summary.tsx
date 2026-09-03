'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, CheckCircle2, AlertTriangle, FileQuestion } from 'lucide-react';
import Link from 'next/link';

export interface ClinicalConflict {
  id: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  surgeon: string;
  type: 'GLEASON_MISMATCH' | 'DATE_ANOMALY' | 'UNLINKED_PATHOLOGY' | 'DUPLICATE_STAGE';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export function ConflictSummary({
  conflicts,
}: {
  conflicts: ClinicalConflict[];
}) {
  if (conflicts.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
        <CardContent className="p-8 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Zero Data Conflicts Detected</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto [text-wrap:pretty]">
              All diagnostic biopsy grades, operative dates, and post-op histology reports match BAUS cross-validation rules.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 dark:border dark:border-amber-900/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Clinical Validation Anomaly Queue
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-medium">Cross-field mismatches requiring data manager review</p>
          </div>
        </div>
        <Badge variant="warning" className="text-[10px] font-mono [font-variant-numeric:tabular-nums]">
          {conflicts.length} Anomalies Flagged
        </Badge>
      </CardHeader>

      <CardContent className="p-5 space-y-3">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#121212] border border-slate-200 dark:border-[#272727] hover:border-teal-500/50 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={conflict.severity === 'high' ? 'destructive' : 'warning'}
                  className="text-[9px] uppercase tracking-wider"
                >
                  {conflict.severity}
                </Badge>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{conflict.title}</span>
                <span className="text-[10px] font-mono text-slate-400 [font-variant-numeric:tabular-nums]">
                  MRN: {conflict.hospitalNumber} • {conflict.surgeon}
                </span>
              </div>
              <p className="text-xs text-slate-500 [text-wrap:pretty]">{conflict.description}</p>
            </div>

            <Link href={`/patients/${conflict.patientId}`} className="shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 font-semibold">
                <span>Resolve Anomaly</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
