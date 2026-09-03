'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { FollowUpTable } from '@/components/follow-ups/follow-up-table';
import { useFollowUps } from '@/hooks/use-follow-ups';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSession } from '@/lib/auth';

export default function FollowUpsHubPage() {
  const { user: currentUser } = useSession();
  const [scope, setScope] = useState<'personal' | 'trust'>('personal');

  // Single hook call — all 4 buckets computed in one pass from the in-memory cache.
  const { allBuckets, isLoading } = useFollowUps();
  const targetSurgeon = currentUser?.role === 'Consultant Surgeon' && currentUser.surgeonCode ? currentUser.surgeonCode : null;

  const filterBucket = (list: typeof allBuckets.all) => {
    if (scope === 'personal' && targetSurgeon) {
      return list.filter((fu) => fu.patient.primarySurgeon === targetSurgeon);
    }
    return list;
  };

  const allFollowUps = filterBucket(allBuckets.all);
  const dueFollowUps = filterBucket(allBuckets.due);
  const overdueFollowUps = filterBucket(allBuckets.overdue);
  const completedFollowUps = filterBucket(allBuckets.completed);

  return (
    <div className="space-y-4">
      {/* Header and Caseload Scope Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <PageHeader
          title="Follow-ups Management"
          description="Monitor 7-milestone longitudinal outcomes (2, 6, 12, 18, 24, 30, 36 months) across the RALP cohort"
          breadcrumbs={[{ label: 'Follow-ups' }]}
        />

        {targetSurgeon && (
          <div className="p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center text-xs font-semibold self-start sm:self-auto shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setScope('personal')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                scope === 'personal'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              My Patients ({targetSurgeon})
            </button>
            <button
              type="button"
              onClick={() => setScope('trust')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                scope === 'trust'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              All Surgeons ({allBuckets.all.length})
            </button>
          </div>
        )}
      </div>

      {/* Status Tabs Bar */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 h-auto gap-1">
          <TabsTrigger
            value="all"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>All Milestones</span>
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300">
              {allFollowUps.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="due"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Due Soon</span>
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              {dueFollowUps.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="overdue"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Overdue Alerts</span>
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
              {overdueFollowUps.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="completed"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Completed</span>
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {completedFollowUps.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <FollowUpTable followUps={allFollowUps} />
        </TabsContent>

        <TabsContent value="due" className="mt-0">
          <FollowUpTable followUps={dueFollowUps} />
        </TabsContent>

        <TabsContent value="overdue" className="mt-0">
          <FollowUpTable followUps={overdueFollowUps} />
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <FollowUpTable followUps={completedFollowUps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
