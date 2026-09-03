import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Activity,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ClinicalStatusType =
  | 'r0'
  | 'r1'
  | 'low-risk'
  | 'int-risk'
  | 'high-risk'
  | 'recurrence'
  | 'stable'
  | 'active'
  | 'pending'
  | 'overdue'
  | 'completed'
  | 'pad-free'
  | 'leaking';

interface StatusPillProps {
  type?: ClinicalStatusType;
  label?: string;
  className?: string;
  size?: 'sm' | 'default';
}

export function StatusPill({ type = 'stable', label, className, size = 'default' }: StatusPillProps) {
  const getStatusConfig = () => {
    switch (type) {
      case 'r0':
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          defaultLabel: 'R0 Negative Margin',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'r1':
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
          defaultLabel: 'R1 Positive Margin',
          classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        };
      case 'low-risk':
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          defaultLabel: 'Low Risk',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'int-risk':
        return {
          icon: <Activity className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
          defaultLabel: 'Intermediate Risk',
          classes: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        };
      case 'high-risk':
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
          defaultLabel: 'High Risk',
          classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        };
      case 'recurrence':
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />,
          defaultLabel: 'PSA Recurrence (≥0.2)',
          classes: 'bg-rose-50 text-rose-900 border-rose-300 font-bold dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700',
        };
      case 'overdue':
        return {
          icon: <Clock className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
          defaultLabel: 'Overdue Follow-up',
          classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />,
          defaultLabel: 'Completed',
          classes: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
        };
      case 'pad-free':
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          defaultLabel: 'Pad-Free (Continent)',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        };
      default:
        return {
          icon: <Activity className="h-3.5 w-3.5 text-slate-500 shrink-0" />,
          defaultLabel: 'Active',
          classes: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-tight shadow-sm',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.classes,
        className
      )}
    >
      {config.icon}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
}
