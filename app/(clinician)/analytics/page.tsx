'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { OutcomeChart } from '@/components/analytics/outcome-chart';
import { RecoveryCurve } from '@/components/analytics/recovery-curve';
import { useOutcomes } from '@/hooks/use-outcomes';
import { Users, Scissors, CheckCircle2, AlertCircle, Activity, Percent } from 'lucide-react';

function Stat({
  label, value, suffix, icon: Icon, tone,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card className="glow-card border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 inset-x-0 h-1 ${tone.replace('border-l-', 'bg-')}`} />
      <CardContent className="p-4 pt-3.5">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
          {value === null ? '—' : value.toLocaleString()}
          {value !== null && suffix ? <span className="text-base font-semibold ml-0.5">{suffix}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsHubPage() {
  const { curve, summary, isLoading, error } = useOutcomes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcomes & Benchmarking"
        description="Functional recovery, oncological control and surgeon benchmarking, computed from the registry"
        breadcrumbs={[{ label: 'Analytics' }]}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Stat label="Patients" value={isLoading ? null : summary?.patients ?? null} icon={Users} tone="border-l-teal-600" />
        <Stat label="Operations" value={isLoading ? null : summary?.operations ?? null} icon={Scissors} tone="border-l-indigo-600" />
        <Stat label="Assessments" value={isLoading ? null : summary?.completedFollowUps ?? null} icon={CheckCircle2} tone="border-l-emerald-600" />
        <Stat label="Overdue" value={isLoading ? null : summary?.overdueFollowUps ?? null} icon={AlertCircle} tone="border-l-amber-600" />
        <Stat label="BCR events" value={isLoading ? null : summary?.bcrEvents ?? null} icon={Activity} tone="border-l-rose-600" />
        <Stat label="Positive margins" value={isLoading ? null : summary?.marginPositiveRate ?? null} suffix="%" icon={Percent} tone="border-l-slate-600" />
      </div>

      <RecoveryCurve curve={curve} />
      <OutcomeChart />

      <p className="text-[11px] leading-relaxed text-slate-500">
        Definitions: continence is pad-free (dry, or occasional leakage without a pad); potency is
        SHIM ≥ 17; biochemical recurrence is PSA ≥ 0.2 ng/mL. Rates count completed assessments
        only, so a milestone patients have not yet reached reports no data rather than 0%.
      </p>
    </div>
  );
}
