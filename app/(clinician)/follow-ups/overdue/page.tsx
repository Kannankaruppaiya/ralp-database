'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { FollowUpTable } from '@/components/follow-ups/follow-up-table';
import { useFollowUps } from '@/hooks/use-follow-ups';

export default function FollowUpsOverduePage() {
  const { followUps, isLoading } = useFollowUps('overdue');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overdue Follow-up Alerts"
        description="Patient milestone checks past their due window requiring urgent data completion or contact"
        breadcrumbs={[
          { label: 'Follow-ups', href: '/follow-ups' },
          { label: 'Overdue Alerts' },
        ]}
      />
      <FollowUpTable followUps={followUps} />
    </div>
  );
}
