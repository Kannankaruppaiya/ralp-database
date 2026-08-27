'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { FollowUpTable } from '@/components/follow-ups/follow-up-table';
import { useFollowUps } from '@/hooks/use-follow-ups';

export default function FollowUpsCompletedPage() {
  const { followUps, isLoading } = useFollowUps('completed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completed Follow-up Milestones"
        description="Archived outcomes evaluations with complete PSA, IPSS, SHIM, and continence records"
        breadcrumbs={[
          { label: 'Follow-ups', href: '/follow-ups' },
          { label: 'Completed' },
        ]}
      />
      <FollowUpTable followUps={followUps} />
    </div>
  );
}
