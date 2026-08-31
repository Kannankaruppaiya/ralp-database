'use client';

import React from 'react';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { BaselineCancerCard } from '@/components/cancer/baseline-cancer-card';
import { PageHeader } from '@/components/layout/page-header';

export default function PatientBaselinePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading, refresh } = usePatient(resolvedParams.patientId);

  if (isLoading || !patient) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading baseline cancer data...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.surname} — Pre-Op Cancer Baseline`}
        breadcrumbs={[
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}`, href: `/patients/${patient.id}` },
          { label: 'Baseline Cancer' },
        ]}
      />

      <PatientHeader patient={patient} />
      <PatientTabs patientId={patient.id} />
      <BaselineCancerCard patientId={patient.id} data={patient.baseline} onUpdate={refresh} />
    </div>
  );
}
