'use client';

import React from 'react';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { PatientTimeline } from '@/components/patient/patient-timeline';
import { PageHeader } from '@/components/layout/page-header';

export default function PatientTimelinePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading } = usePatient(resolvedParams.patientId);

  if (isLoading || !patient) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading timeline...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.surname} — Care Pathway Timeline`}
        breadcrumbs={[
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}`, href: `/patients/${patient.id}` },
          { label: 'Timeline' },
        ]}
      />

      <PatientHeader patient={patient} />
      <PatientTabs patientId={patient.id} />
      <PatientTimeline patient={patient} />
    </div>
  );
}
