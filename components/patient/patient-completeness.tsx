import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DataCompleteness } from '@/types/common';

export function PatientCompleteness({ completeness }: { completeness: DataCompleteness }) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500 text-emerald-700';
    if (score >= 60) return 'bg-amber-500 text-amber-700';
    return 'bg-rose-500 text-rose-700';
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Data Completeness</span>
          <span className="text-xs font-normal text-slate-500">(Registry Standard)</span>
        </h3>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{completeness.score}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800 overflow-hidden mb-4">
        <div
          className={cn('h-2 rounded-full transition-all duration-500', getScoreColor(completeness.score).split(' ')[0])}
          style={{ width: `${completeness.score}%` }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          {completeness.baselineComplete ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          )}
          <span className={completeness.baselineComplete ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}>
            Baseline Cancer
          </span>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          {completeness.operationComplete ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          )}
          <span className={completeness.operationComplete ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}>
            Theatre Notes
          </span>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          {completeness.histologyComplete ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          )}
          <span className={completeness.histologyComplete ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}>
            Histology Report
          </span>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <CheckCircle2 className={cn('h-4 w-4 flex-shrink-0', completeness.followUpsComplete > 0 ? 'text-emerald-600' : 'text-slate-300')} />
          <span className="text-slate-700 dark:text-slate-300 font-medium">
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
    <div className={cn('space-y-1 group relative', className)}>
      <div className="flex items-center justify-between">
        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
        {source && (
          <span
            className="text-[10px] text-slate-400 hover:text-blue-600 transition-colors font-medium cursor-help"
            title={`Source: ${source.type}${source.documentTitle ? ` (${source.documentTitle})` : ''} • ${source.verified ? 'Verified by ' + (source.verifiedBy || 'Clinician') : 'Unverified'}`}
          >
            [{source.type.split(' ')[0]}]
          </span>
        )}
      </div>
      <dd className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value || <span className="text-slate-400 font-normal italic">Not recorded</span>}
        {badge}
      </dd>
      {helpText && <p className="text-[11px] text-slate-400">{helpText}</p>}
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
    <div className={cn('rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
