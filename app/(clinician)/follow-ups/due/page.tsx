'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { FollowUpTable } from '@/components/follow-ups/follow-up-table';
import { useFollowUps } from '@/hooks/use-follow-ups';

export default function FollowUpsDuePage() {
  const { followUps, isLoading } = useFollowUps('due');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups Due Soon (Next 30 Days)"
        description="Upcoming milestone assessments requiring clinical review or PROM dispatch"
        breadcrumbs={[
          { label: 'Follow-ups', href: '/follow-ups' },
          { label: 'Due Soon' },
        ]}
      />
      <FollowUpTable followUps={followUps} />
    </div>
  );
}
