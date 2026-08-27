import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      {/* Admin Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-900/30 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-72 bg-indigo-900/50 rounded-lg" />
          <div className="h-4 w-96 bg-indigo-950/70 rounded" />
        </div>
        <ShieldCheck className="h-10 w-10 text-indigo-400 opacity-50" />
      </div>

      {/* Admin Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
          >
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Admin Table Skeleton */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="h-12 w-full bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
