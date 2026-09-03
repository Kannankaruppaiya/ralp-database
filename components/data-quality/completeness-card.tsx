'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export interface CompletenessMetrics {
  totalPatients: number;
  averageScore: number;
  baselineRate: number;
  operationRate: number;
  histologyRate: number;
  promsRate: number;
}

export function CompletenessCard({
  metrics,
  onRunAudit,
}: {
  metrics: CompletenessMetrics;
  onRunAudit?: () => void;
}) {
  const isCompliant = metrics.averageScore >= 85;

  const categories = [
    { label: 'Pre-Op Baseline (PSA & Biopsy)', rate: metrics.baselineRate, target: 95 },
    { label: 'Surgical Theatre Logs (RALP)', rate: metrics.operationRate, target: 98 },
    { label: 'Histology & Margins (pTNM)', rate: metrics.histologyRate, target: 90 },
    { label: 'Functional PROMs (2m-24m)', rate: metrics.promsRate, target: 75 },
  ];

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818] overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 dark:border dark:border-teal-900/60">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              National BAUS / NPCA Quality Score
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-medium">Cohort-wide clinical completeness index</p>
          </div>
        </div>
        <Badge
          variant={isCompliant ? 'success' : 'warning'}
          className="font-mono text-xs [font-variant-numeric:tabular-nums]"
        >
          {isCompliant ? 'NPCA Compliant (>85%)' : 'Action Required (<85%)'}
        </Badge>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Score Highlight Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#121212] border border-slate-200/80 dark:border-[#272727]">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Registry Completeness</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
                {metrics.averageScore}%
              </span>
              <span className="text-xs text-slate-500 font-medium">/ 100% target</span>
            </div>
            <p className="text-[11px] text-slate-500 [text-wrap:pretty]">
              Calculated across {metrics.totalPatients} registered RALP patients at Oxford University Hospitals NHS FT.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCompliant ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Ready for Annual Submission</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Below Audit Benchmark</span>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Domain Completeness Breakdown</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {categories.map((cat) => {
              const isPassing = cat.rate >= cat.target;
              return (
                <div
                  key={cat.label}
                  className="p-3 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.label}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white [font-variant-numeric:tabular-nums]">
                      {cat.rate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-[#1F1F1F] overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        isPassing ? 'bg-teal-600 dark:bg-teal-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, cat.rate)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono [font-variant-numeric:tabular-nums]">
                    <span>Target: {cat.target}%</span>
                    <span className={isPassing ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-amber-500 font-semibold'}>
                      {isPassing ? '✓ Target Met' : '! Attention Needed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
