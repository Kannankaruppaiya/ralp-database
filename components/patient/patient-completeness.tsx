import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { DataCompleteness } from '@/types/common';

export function PatientCompleteness({ completeness }: { completeness: DataCompleteness }) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-600';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">National Registry Completeness</span>
          <Badge variant="outline" className="text-[10px] font-mono text-slate-500 py-0 h-4">NPCA Standard</Badge>
        </div>
        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono [font-variant-numeric:tabular-nums]">
          {completeness.score}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-3">
        <div
          className={cn('h-1.5 rounded-full transition-all duration-500', getScoreColor(completeness.score))}
          style={{ width: `${completeness.score}%` }}
        />
      </div>

      {/* Checklist Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
          {completeness.baselineComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" aria-hidden="true" />
          )}
          <span className="font-medium text-[11px]">Baseline Oncology</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
          {completeness.operationComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" aria-hidden="true" />
          )}
          <span className="font-medium text-[11px]">Theatre Record</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
          {completeness.histologyComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" aria-hidden="true" />
          )}
          <span className="font-medium text-[11px]">Histopathology</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
          <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', completeness.followUpsComplete > 0 ? 'text-emerald-600' : 'text-slate-400')} aria-hidden="true" />
          <span className="font-medium text-[11px] font-mono [font-variant-numeric:tabular-nums]">
            {completeness.followUpsComplete}/7 Follow-ups
          </span>
        </div>
      </div>
    </div>
  );
}

export interface FieldSourceMetadata {
  type: 'Operation Note' | 'Clinic Letter' | 'Histology Report' | 'Patient App' | 'MDT Outcome' | 'Manual Entry';
  documentTitle?: string;
  importedDate?: string;
  verified?: boolean;
  verifiedBy?: string;
}

export function PatientDataField({
  label,
  value,
  badge,
  helpText,
  source,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  badge?: React.ReactNode;
  helpText?: string;
  source?: FieldSourceMetadata;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
      </div>
      <dd className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 font-mono [font-variant-numeric:tabular-nums]">
        {value || <span className="text-slate-400 font-normal italic text-xs">Not recorded</span>}
        {badge}
      </dd>
      {helpText && <p className="text-[11px] text-slate-400 font-normal">{helpText}</p>}
    </div>
  );
}

export function PatientDataSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
