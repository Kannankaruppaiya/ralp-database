'use client';

import React from 'react';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { PromTrends } from '@/components/proms/prom-trends';
import { IPSSQuestionnaire } from '@/components/proms/ipss/ipss-questionnaire';
import { SHIMQuestionnaire } from '@/components/proms/shim/shim-questionnaire';
import { ContinenceSelector } from '@/components/proms/continence/continence-selector';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { db } from '@/lib/api-client';

export default function PatientPromsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading, refresh } = usePatient(resolvedParams.patientId);

  if (isLoading || !patient) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading PROMs...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.firstName} ${patient.surname} — Patient-Reported Outcome Measures`}
        breadcrumbs={[
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}`, href: `/patients/${patient.id}` },
          { label: 'PROMs' },
        ]}
      />

      <PatientHeader patient={patient} />
      <PatientTabs patientId={patient.id} />

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Longitudinal Recovery Trends</TabsTrigger>
          <TabsTrigger value="ipss">IPSS Urinary Tool</TabsTrigger>
          <TabsTrigger value="shim">SHIM Erectile Tool</TabsTrigger>
          <TabsTrigger value="continence">Continence & Pads</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <PromTrends patient={patient} />
        </TabsContent>

        <TabsContent value="ipss">
          <IPSSQuestionnaire
            onComplete={(answers, score) => {
              db.addPromSubmission(patient.id, {
                patientId: patient.id,
                milestone: 'ad-hoc',
                completedAt: new Date().toISOString(),
                completedBy: 'clinician',
                ipssAnswers: answers,
                ipssScore: score,
              });
              refresh();
            }}
          />
        </TabsContent>

        <TabsContent value="shim">
          <SHIMQuestionnaire
            onComplete={(answers, score) => {
              db.addPromSubmission(patient.id, {
                patientId: patient.id,
                milestone: 'ad-hoc',
                completedAt: new Date().toISOString(),
                completedBy: 'clinician',
                shimAnswers: answers,
                shimScore: score,
              });
              refresh();
            }}
          />
        </TabsContent>

        <TabsContent value="continence">
          <ContinenceSelector
            onChange={(data) => {
              db.addPromSubmission(patient.id, {
                patientId: patient.id,
                milestone: 'ad-hoc',
                completedAt: new Date().toISOString(),
                completedBy: 'clinician',
                continence: data,
              });
              refresh();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
