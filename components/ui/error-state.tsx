import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Unable to load clinical records',
  message = 'An unexpected issue occurred while fetching data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mb-3">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 [text-wrap:balance]">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-4 [text-wrap:pretty]">
        {message}
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="gap-1.5 border-rose-300 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 shadow-sm font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
