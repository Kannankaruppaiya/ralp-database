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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Follow-ups Management"
          description="Monitor 7-milestone longitudinal outcomes (2, 6, 12, 18, 24, 30, 36 months) across the RALP cohort"
          breadcrumbs={[{ label: 'Follow-ups' }]}
        />

        {targetSurgeon && (
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setScope('personal')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scope === 'personal'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              My Patients ({targetSurgeon})
            </button>
            <button
              type="button"
              onClick={() => setScope('trust')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scope === 'trust'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Surgeons ({allBuckets.all.length})
            </button>
          </div>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Milestones ({allFollowUps.length})</TabsTrigger>
          <TabsTrigger value="due">Due Soon ({dueFollowUps.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Alerts ({overdueFollowUps.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedFollowUps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <FollowUpTable followUps={allFollowUps} />
        </TabsContent>

        <TabsContent value="due">
          <FollowUpTable followUps={dueFollowUps} />
        </TabsContent>

        <TabsContent value="overdue">
          <FollowUpTable followUps={overdueFollowUps} />
        </TabsContent>

        <TabsContent value="completed">
          <FollowUpTable followUps={completedFollowUps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

