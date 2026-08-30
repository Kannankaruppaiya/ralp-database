'use client';

import React from 'react';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { FollowUpTimeline } from '@/components/follow-ups/follow-up-timeline';
import { PageHeader } from '@/components/layout/page-header';

export default function PatientFollowUpsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading, refresh } = usePatient(resolvedParams.patientId);

  if (isLoading || !patient) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading follow-ups...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.surname} — Follow-ups (2m to 36m)`}
        breadcrumbs={[
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}`, href: `/patients/${patient.id}` },
          { label: 'Follow-ups' },
        ]}
      />

      <PatientHeader patient={patient} />
      <PatientTabs patientId={patient.id} />
      <FollowUpTimeline followUps={patient.followUps} patientId={patient.id} onUpdate={refresh} />
    </div>
  );
}
