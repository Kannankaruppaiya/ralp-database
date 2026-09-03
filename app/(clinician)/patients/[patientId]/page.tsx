'use client';

import React from 'react';
import Link from 'next/link';
import { usePatient } from '@/hooks/use-patient';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientTabs } from '@/components/patient/patient-tabs';
import { PatientSummary } from '@/components/patient/patient-summary';
import { PatientCompleteness } from '@/components/patient/patient-completeness';
import { PromTrends } from '@/components/proms/prom-trends';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { formatDate, formatPsa, formatNhsNumber } from '@/lib/formatters';
import {
  Dna,
  Scissors,
  Microscope,
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ChevronRight,
  Clock,
} from 'lucide-react';

export default function PatientOverviewPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = React.use(params);
  const { patient, isLoading, refresh } = usePatient(resolvedParams.patientId);

  if (isLoading || !patient) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const nextFollowUp = patient.followUps?.find((f) => f.status === 'scheduled' || f.status === 'overdue');
  const latestFollowUp = patient.followUps && patient.followUps.length > 0 ? patient.followUps[patient.followUps.length - 1] : null;
  const hasRecurrence = patient.followUps?.some((f) => f.biochemicalRecurrence);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`${patient.firstName} ${patient.surname}`}
        description={`NHS: ${formatNhsNumber(patient.nhsNumber)} • MRN: ${patient.hospitalNumber} • Primary Surgeon: ${patient.primarySurgeon}`}
        breadcrumbs={[
          { label: 'Patients Registry', href: '/patients' },
          { label: `${patient.firstName} ${patient.surname}` },
        ]}
      />

      {/* Patient Master Header */}
      <PatientHeader patient={patient} />

      {/* Tab Navigation Strip */}
      <PatientTabs patientId={patient.id} />

      {/* Clinical Executive Snapshot (4 Metrics Grid) */}
      <PatientSummary patient={patient} />

      {/* Actionable Clinical Status & Next Step Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Next Scheduled Milestone & Action */}
        <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>Next Milestone</span>
              </span>
              {nextFollowUp && (
                <Badge variant={nextFollowUp.status === 'overdue' ? 'destructive' : 'outline'} className="text-[10px] font-mono">
                  {nextFollowUp.milestone.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
              {nextFollowUp ? (
                <>Due on {formatDate(nextFollowUp.dueDate)}</>
              ) : (
                <>All 7 Schedule Milestones Complete</>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {nextFollowUp
                ? `Serum PSA test and PROMs (IPSS/SHIM) collection for ${nextFollowUp.targetMonths}-month post-op review.`
                : 'Patient has concluded standard 36-month RALP surveillance trajectory.'}
            </p>
          </div>

          <Link href={`/patients/${patient.id}/follow-ups`}>
            <Button size="sm" variant="outline" className="w-full text-xs font-semibold gap-1 border-teal-300 text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/40">
              <span>View Milestone Schedule</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        {/* Biochemical Surveillance Status */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                <span>Oncological Status</span>
              </span>
              <Badge variant={hasRecurrence ? 'destructive' : 'success'} className="text-[10px] font-semibold">
                {hasRecurrence ? 'BCR Detected' : 'PSA Remission'}
              </Badge>
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white [font-variant-numeric:tabular-nums]">
              Latest PSA: {latestFollowUp?.psa !== undefined ? `${latestFollowUp.psa} ng/mL` : 'Awaiting baseline post-op'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {hasRecurrence
                ? 'Biochemical recurrence criteria met (PSA ≥ 0.20 ng/mL). Consider salvage radiotherapy referral.'
                : 'Undetectable serum PSA maintained below BCR threshold (< 0.20 ng/mL).'}
            </p>
          </div>

          <Link href={`/patients/${patient.id}/proms`}>
            <Button size="sm" variant="ghost" className="w-full text-xs font-semibold gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-300">
              <span>Inspect PSA Curves</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        {/* Registry Completeness Progress */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3">
          <PatientCompleteness completeness={patient.completeness} />
          <Link href={`/patients/${patient.id}/documents`} className="block">
            <Button size="sm" variant="ghost" className="w-full text-xs font-semibold gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-300">
              <span>View Clinical Documents</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Longitudinal Functional Recovery Charts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Longitudinal Recovery Curves & Surveillance</span>
          </h2>
          <Link href={`/patients/${patient.id}/proms`} className="text-xs text-teal-700 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1">
            <span>Full PROMs Analysis</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <PromTrends patient={patient} />
      </section>

      {/* Structured Fast Navigation Cards to Deep Clinical Records */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Detailed Clinical Records
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href={`/patients/${patient.id}/baseline`}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-teal-500/80 hover:shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                <Dna className="h-4 w-4 text-cyan-600" aria-hidden="true" />
                <span>1. Baseline Diagnostic Oncology</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Biopsy Gleason score, PSA history, mpMRI PI-RADS, and clinical stage.
            </p>
          </Link>

          <Link
            href={`/patients/${patient.id}/operation`}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-teal-500/80 hover:shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                <Scissors className="h-4 w-4 text-teal-600" aria-hidden="true" />
                <span>2. Surgical Theatre Notes</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Nerve sparing grades (2/5 to 5/5), bladder neck preservation, console duration.
            </p>
          </Link>

          <Link
            href={`/patients/${patient.id}/histology`}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-teal-500/80 hover:shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                <Microscope className="h-4 w-4 text-purple-600" aria-hidden="true" />
                <span>3. Post-Op Histopathology</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              pTNM staging, surgical margin status (R0/R1), EPE and SVI involvement.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
