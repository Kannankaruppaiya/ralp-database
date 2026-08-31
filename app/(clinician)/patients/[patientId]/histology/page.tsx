'use client';

import React from 'react';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { HistologySummary } from '@/components/histology/histology-summary';
import { PageHeader } from '@/components/layout/page-header';

export default function PatientHistologyPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading, refresh } = usePatient(resolvedParams.patientId);

  if (isLoading || !patient) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading histology report...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.surname} — Histopathology Report`}
        breadcrumbs={[
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}`, href: `/patients/${patient.id}` },
          { label: 'Histology' },
        ]}
      />

      <PatientHeader patient={patient} />
      <PatientTabs patientId={patient.id} />
      <HistologySummary patientId={patient.id} data={patient.histology} onUpdate={refresh} />
    </div>
  );
}
