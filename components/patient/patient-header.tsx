import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNhsNumber, formatDate, getRiskCategory } from '@/lib/formatters';
import { Calendar, Hash, Building2, Stethoscope, Printer } from 'lucide-react';
import Link from 'next/link';

export function PatientHeader({ patient }: { patient: PatientFullRecord }) {
  const risk = getRiskCategory(
    patient.baseline?.psa,
    patient.baseline?.gleasonGrade,
    patient.baseline?.clinicalStage
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-[#272727] dark:bg-[#181818] mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Patient Identity */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-xl shadow-sm">
            {patient.firstName[0]}{patient.surname[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white [text-wrap:balance]">
                {patient.firstName} {patient.surname}
              </h1>
              <Badge variant="outline" className={`text-xs font-semibold ${risk.color}`}>
                {risk.category}
              </Badge>
              <Badge variant={patient.status === 'Active' ? 'success' : 'secondary'} className="text-xs font-semibold">
                {patient.status}
              </Badge>
            </div>

            {/* Clinical identifiers */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-mono [font-variant-numeric:tabular-nums]">
                <Hash className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                NHS: <strong className="text-slate-700 dark:text-slate-200">{formatNhsNumber(patient.nhsNumber)}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-mono [font-variant-numeric:tabular-nums]">
                <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                MRN: <strong className="text-slate-700 dark:text-slate-200">{patient.hospitalNumber}</strong>
              </span>
              <span className="flex items-center gap-1.5 [font-variant-numeric:tabular-nums]">
                <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                DOB: {formatDate(patient.dateOfBirth)} ({patient.age || '—'} yrs)
              </span>
              <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-semibold">
                <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                Surgeon: <strong>{patient.primarySurgeon}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Patient Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <Link href={`/reports/clinic-summary?patientId=${patient.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clinic Summary</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
