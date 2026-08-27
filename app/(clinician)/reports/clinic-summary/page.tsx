'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { ClinicSummary } from '@/components/reports/clinic-summary';
import { usePatients } from '@/hooks/use-patients';
import { Select } from '@/components/ui/select';

function ClinicSummaryContent() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId');
  const { allPatients, isLoading } = usePatients();
  const [selectedId, setSelectedId] = useState<string>(initialPatientId || allPatients[0]?.id || 'pat-001');

  const selectedPatient = allPatients.find((p) => p.id === selectedId) || allPatients[0];

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Printable Clinic Summary"
          description="Multidisciplinary clinical letter format with complete surgical, histological, and follow-up outcome data"
          breadcrumbs={[
            { label: 'Reports', href: '/reports' },
            { label: 'Clinic Summary' },
          ]}
          action={
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Select Patient:</span>
              <Select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-64 text-xs"
              >
                {allPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.surname} ({p.hospitalNumber})
                  </option>
                ))}
              </Select>
            </div>
          }
        />
      </div>

      {selectedPatient ? (
        <ClinicSummary patient={selectedPatient} />
      ) : (
        <div className="p-12 text-center text-sm text-slate-500">No patient selected.</div>
      )}
    </div>
  );
}

export default function ClinicSummaryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading summary...</div>}>
      <ClinicSummaryContent />
    </Suspense>
  );
}
