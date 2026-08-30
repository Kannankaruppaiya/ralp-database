'use client';

import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNhsNumber, formatDate, getRiskCategory } from '@/lib/formatters';
import { User, Calendar, Hash, Building2, Stethoscope, Printer, FileEdit } from 'lucide-react';
import Link from 'next/link';

export function PatientHeader({ patient }: { patient: PatientFullRecord }) {
  const risk = getRiskCategory(
    patient.baseline?.psa,
    patient.baseline?.gleasonGrade,
    patient.baseline?.clinicalStage
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Patient Identity */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xl border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
            {patient.firstName[0]}{patient.surname[0]}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {patient.firstName} {patient.surname}
              </h1>
              <Badge variant="outline" className={risk.color}>
                {risk.category}
              </Badge>
              <Badge variant={patient.status === 'Active' ? 'success' : 'secondary'}>
                {patient.status}
              </Badge>
            </div>
            
            {/* Clinical identifiers */}
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-mono">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                NHS: <strong className="text-slate-700 dark:text-slate-300">{formatNhsNumber(patient.nhsNumber)}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                MRN: <strong className="text-slate-700 dark:text-slate-300">{patient.hospitalNumber}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                DOB: {formatDate(patient.dateOfBirth)} ({patient.age || '—'} yrs)
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
                <Stethoscope className="h-3.5 w-3.5" />
                Lead Surgeon: <strong>{patient.primarySurgeon}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Patient Actions */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <Link href={`/reports/clinic-summary?patientId=${patient.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              <span>Clinic Summary</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
