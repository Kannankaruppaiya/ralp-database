'use client';

import React from 'react';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { DocumentList } from '@/components/documents/document-list';
import { useDocuments } from '@/hooks/use-documents';
import { PageHeader } from '@/components/layout/page-header';

export default function PatientDocumentsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading } = usePatient(resolvedParams.patientId);
  const { documents: patientDocs } = useDocuments(resolvedParams.patientId);

  if (isLoading || !patient) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading documents...</div>;
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.surname} — Clinical Documents`}
        breadcrumbs={[
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}`, href: `/patients/${patient.id}` },
          { label: 'Documents' },
        ]}
      />

      <PatientHeader patient={patient} />
      <PatientTabs patientId={patient.id} />
      <DocumentList documents={patientDocs} />
    </div>
  );
}
