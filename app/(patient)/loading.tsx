import React from 'react';
import { HeartPulse } from 'lucide-react';

export default function PatientLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse p-4">
      {/* Patient Greeting Skeleton */}
      <div className="p-6 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-teal-200/60 dark:bg-teal-900/40 rounded-lg" />
          <div className="h-4 w-72 bg-teal-100/80 dark:bg-teal-900/30 rounded" />
        </div>
        <HeartPulse className="h-8 w-8 text-teal-600 dark:text-teal-400 opacity-60 animate-bounce" />
      </div>

      {/* Patient Questionnaire Card Skeleton */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="p-4 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/30 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-4">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 w-36 bg-teal-200 dark:bg-teal-900/50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
