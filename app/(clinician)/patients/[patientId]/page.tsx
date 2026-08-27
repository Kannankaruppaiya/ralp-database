'use client';

import React from 'react';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { PatientSummary } from '@/components/patient/patient-summary';
import { PatientCompleteness } from '@/components/patient/patient-completeness';
import { BaselineCancerCard } from '@/components/cancer/baseline-cancer-card';
import { OperationSummary } from '@/components/operation/operation-summary';
import { HistologySummary } from '@/components/histology/histology-summary';
import { PromTrends } from '@/components/proms/prom-trends';
import { FollowUpTimeline } from '@/components/follow-ups/follow-up-timeline';
import { DocumentList } from '@/components/documents/document-list';
import { useDocuments } from '@/hooks/use-documents';
import { PageHeader } from '@/components/layout/page-header';

export default function PatientOverviewPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading, refresh } = usePatient(resolvedParams.patientId);

  if (isLoading || !patient) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading patient record...</div>;
  }

  const { documents: patientDocs } = useDocuments(patient?.id ?? '');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.surname}`}
        description={`NHS: ${patient.nhsNumber} | MRN: ${patient.hospitalNumber} | Lead Surgeon: ${patient.primarySurgeon}`}
        breadcrumbs={[
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}` },
        ]}
      />

      <PatientHeader patient={patient} />
      <PatientTabs patientId={patient.id} />

      {/* Patient Summary KPIs */}
      <PatientSummary patient={patient} />

      {/* Registry Completeness Score */}
      <PatientCompleteness completeness={patient.completeness} />

      {/* Core Clinical Data Sections */}
      <div className="grid grid-cols-1 gap-6">
        <BaselineCancerCard patientId={patient.id} data={patient.baseline} onUpdate={refresh} />
        <OperationSummary patientId={patient.id} data={patient.operation} onUpdate={refresh} />
        <HistologySummary patientId={patient.id} data={patient.histology} onUpdate={refresh} />
        <PromTrends patient={patient} />
        <FollowUpTimeline followUps={patient.followUps} patientId={patient.id} onUpdate={refresh} />
      </div>
    </div>
  );
}
