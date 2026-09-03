'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { ClinicSummary } from '@/components/reports/clinic-summary';
import { usePatients } from '@/hooks/use-patients';
import { usePatient } from '@/hooks/use-patient';
import { Select } from '@/components/ui/select';

function ClinicSummaryContent() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId');
  // The picker shows a page of patients; the summary itself is fetched by id,
  // so a patient linked to directly still resolves even when they are not on
  // the first page.
  const { patients: pickerPatients, isLoading } = usePatients({ pageSize: 100 });
  const [selectedId, setSelectedId] = useState<string>(initialPatientId ?? '');

  const effectiveId = selectedId || pickerPatients[0]?.id || '';
  const { patient: selectedPatient } = usePatient(effectiveId);

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
                value={effectiveId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-64 text-xs"
              >
                {pickerPatients.map((p) => (
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
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading summary…</div>}>
      <ClinicSummaryContent />
    </Suspense>
  );
}
