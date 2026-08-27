'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { FollowUpTable } from '@/components/follow-ups/follow-up-table';
import { useFollowUps } from '@/hooks/use-follow-ups';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function FollowUpsHubPage() {
  // Single hook call — all 4 buckets computed in one pass from the in-memory cache.
  // Previously: 4 separate useFollowUps() calls = 4× db.getPatients() scans.
  const { allBuckets, isLoading } = useFollowUps();
  const { all: allFollowUps, due: dueFollowUps, overdue: overdueFollowUps, completed: completedFollowUps } = allBuckets;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups Management"
        description="Monitor 7-milestone longitudinal outcomes (2, 6, 12, 18, 24, 30, 36 months) across the RALP cohort"
        breadcrumbs={[{ label: 'Follow-ups' }]}
      />

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

