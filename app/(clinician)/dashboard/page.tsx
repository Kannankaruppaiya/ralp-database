'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/hooks/use-patients';
import { useFollowUps } from '@/hooks/use-follow-ups';
import { useSession } from '@/lib/auth';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';
import {
  Users,
  CalendarClock,
  AlertCircle,
  FileUp,
  Scissors,
  CheckCircle2,
  ArrowRight,
  Plus,
  ShieldCheck,
  HeartPulse,
  Activity,
} from 'lucide-react';

const OutcomeChart = dynamic(
  () => import('@/components/analytics/outcome-chart').then((m) => ({ default: m.OutcomeChart })),
  {
    loading: () => (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm h-72 animate-pulse dark:border-[#272727] dark:bg-[#181818]" />
    ),
    ssr: false,
  }
);

export default function ClinicianDashboardPage() {
  const { user: currentUser } = useSession();
  const [caseloadScope, setCaseloadScope] = useState<'personal' | 'trust'>('personal');

  const { allPatients, isLoading } = usePatients({ fetchAll: true });
  const { allBuckets } = useFollowUps();
  const { jobs: ingestionJobs } = useIngestionJobs();

  // Filter patients based on caseload scope and logged-in user
  const targetSurgeonCode = currentUser?.surgeonCode;

  const displayPatients = caseloadScope === 'personal' && targetSurgeonCode
    ? allPatients.filter((p) => p.primarySurgeon === targetSurgeonCode)
    : allPatients;

  const displayOverdue = caseloadScope === 'personal' && targetSurgeonCode
    ? allBuckets.overdue.filter((fu) => fu.patient.primarySurgeon === targetSurgeonCode)
    : allBuckets.overdue;

  const displayDue = caseloadScope === 'personal' && targetSurgeonCode
    ? allBuckets.due.filter((fu) => fu.patient.primarySurgeon === targetSurgeonCode)
    : allBuckets.due;

  const pendingJobs = ingestionJobs.filter((j) => j.status === 'review_required');

  const totalCohort = displayPatients.length;
  const avgCompleteness = totalCohort > 0
    ? Math.round(displayPatients.reduce((acc, p) => acc + p.completeness.score, 0) / totalCohort)
    : 0;

  return (
    <div className="space-y-6">
      {/* Personalized Clinician Welcome & Caseload Scope Header */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white dark:border-[#272727] dark:bg-[#181818] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-teal-600/20">
            {currentUser?.name.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'NHS'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white [text-wrap:balance]">
                {currentUser?.name} {currentUser?.surgeonCode && `(${currentUser?.surgeonCode})`}
              </h2>
              <Badge variant="outline" className="text-[11px] bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60 font-semibold">
                {currentUser?.role || 'Clinician'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 [text-wrap:pretty]">
              {currentUser?.hospital || 'Oxford University Hospitals'} • {caseloadScope === 'personal' && targetSurgeonCode ? `Personal caseload (${targetSurgeonCode})` : 'Full Trust Registry'}
            </p>
          </div>
        </div>

        {/* Caseload Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {targetSurgeonCode && (
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#121212] border border-slate-200 dark:border-[#272727] flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCaseloadScope('personal')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  caseloadScope === 'personal'
                    ? 'bg-white dark:bg-[#272727] text-teal-700 dark:text-teal-300 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                My Caseload ({targetSurgeonCode})
              </button>
              <button
                type="button"
                onClick={() => setCaseloadScope('trust')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  caseloadScope === 'trust'
                    ? 'bg-white dark:bg-[#272727] text-teal-700 dark:text-teal-300 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Whole Trust ({allPatients.length})
              </button>
            </div>
          )}

          <Link href="/patients/new">
            <Button size="sm" className="gap-1.5 shadow-sm text-xs h-9 font-semibold">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Register Patient</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Role-Specific Smart Banners */}
      {currentUser?.role === 'Clinical Nurse Specialist' && (
        <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 dark:border-purple-900/40 dark:bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HeartPulse className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-xs font-bold text-purple-950 dark:text-purple-200">Specialist Nursing Triage Dashboard Active</div>
              <div className="text-[11px] text-purple-700 dark:text-purple-300 [text-wrap:pretty]">Highlighting TWOC catheter removals, incontinence rehabilitation, and PROM non-responder triage.</div>
            </div>
          </div>
          <Link href="/follow-ups/overdue" className="shrink-0">
            <Button size="sm" variant="outline" className="text-xs border-purple-300 text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:text-purple-300 font-semibold">
              Review Triage Queue
            </Button>
          </Link>
        </div>
      )}

      {currentUser?.role === 'Surgical Registrar' && (
        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-xs font-bold text-blue-950 dark:text-blue-200">Trainee Surgical Logbook Active</div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300 [text-wrap:pretty]">Tracking supervised robotic console minutes, vesicourethral anastomosis (VUA) time, and training case validations.</div>
            </div>
          </div>
          <Link href="/data-ingestion/upload" className="shrink-0">
            <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 font-semibold">
              Submit Op Log
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Top Stat Cards with Tabular-Nums and Clean 360-degree Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cohort Card */}
        <Card className="border-slate-200/90 dark:border-[#272727] bg-white dark:bg-[#181818] shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {caseloadScope === 'personal' && targetSurgeonCode ? `${targetSurgeonCode} Patients` : 'Total Cohort'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
              <Users className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
              {isLoading ? '—' : totalCohort}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {caseloadScope === 'personal' && targetSurgeonCode ? `Managed by ${currentUser?.name}` : 'RALP surgical cohort'}
            </p>
          </CardContent>
        </Card>

        {/* Due Follow-ups Card */}
        <Card className="border-slate-200/90 dark:border-[#272727] bg-white dark:bg-[#181818] shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Follow-ups</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
              {isLoading ? '—' : displayDue.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Scheduled in next 30 days</p>
          </CardContent>
        </Card>

        {/* Overdue Alerts Card */}
        <Card className="border-slate-200/90 dark:border-[#272727] bg-white dark:bg-[#181818] shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono [font-variant-numeric:tabular-nums]">
              {isLoading ? '—' : displayOverdue.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Missing PSA / PROM data</p>
          </CardContent>
        </Card>

        {/* Registry Completeness Card */}
        <Card className="border-slate-200/90 dark:border-[#272727] bg-white dark:bg-[#181818] shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registry Quality</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
              {isLoading ? '—' : `${avgCompleteness}%`}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Caseload completeness index</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Overdue Follow-ups + Ingestion & Caseload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Follow-ups Queue (Left 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200/90 dark:border-[#272727] bg-white dark:bg-[#181818] overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between space-y-0 bg-slate-50/60 dark:bg-[#121212]/60">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
                  <span>
                    Action Required: Overdue Follow-ups ({displayOverdue.length})
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 [text-wrap:pretty]">
                  {caseloadScope === 'personal' && targetSurgeonCode
                    ? `Patients under ${currentUser?.name} pending review`
                    : 'Patients pending milestone review across all surgeons'}
                </p>
              </div>
              <Link href="/follow-ups/overdue">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-teal-700 hover:text-teal-800 hover:bg-teal-50 dark:text-teal-300 font-semibold">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-[#272727]">
              {displayOverdue.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" aria-hidden="true" />
                  No overdue follow-up milestones for this caseload.
                </div>
              ) : (
                displayOverdue.slice(0, 4).map((fu) => (
                  <div key={fu.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-[#1F1F1F]/60 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 dark:bg-[#272727] dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                        {fu.patient.firstName[0]}{fu.patient.surname[0]}
                      </div>
                      <div>
                        <Link href={`/patients/${fu.patient.id}`} className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                          {fu.patient.firstName} {fu.patient.surname}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono text-[11px] [font-variant-numeric:tabular-nums]">MRN: {fu.patient.hospitalNumber}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] font-mono [font-variant-numeric:tabular-nums]">{fu.milestone.toUpperCase()} ({fu.targetMonths}m)</Badge>
                          <span>•</span>
                          <span className="font-medium text-teal-700 dark:text-teal-400">Surgeon: {fu.patient.primarySurgeon}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/patients/${fu.patient.id}/follow-ups`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs font-semibold hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 dark:hover:bg-[#272727] dark:hover:text-teal-300">
                        Update Data
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Surgeon Benchmark Chart */}
          <OutcomeChart />
        </div>

        {/* Sidebar Cards: Pending Ingestion & Caseload Breakdown */}
        <div className="space-y-6">
          {/* Pending Ingestion Card */}
          <Card className="border-slate-200/90 dark:border-[#272727] bg-white dark:bg-[#181818] shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  <span>Document Ingestion</span>
                </span>
                <Badge variant="warning" className="text-[10px] font-mono [font-variant-numeric:tabular-nums]">{pendingJobs.length} Pending</Badge>
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 [text-wrap:pretty]">
                Theatre notes & clinic letters awaiting review
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {pendingJobs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121212] border border-slate-200/60 dark:border-[#272727] text-center text-xs text-slate-500">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" aria-hidden="true" />
                  All theatre notes & clinic documents reconciled.
                </div>
              ) : (
                pendingJobs.map((job) => (
                  <div key={job.id} className="p-3 bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#272727] text-xs space-y-2 shadow-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {job.documentTitle}
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono [font-variant-numeric:tabular-nums]">
                      <span>{job.extractedFields.length} fields extracted</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{job.conflictCount} conflicts</span>
                    </div>
                    <Link href="/data-ingestion/extraction-review" className="block">
                      <Button size="sm" className="w-full text-xs h-7 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                        Review & Approve
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Surgeons Cohort Breakdown */}
          <Card className="shadow-sm border-slate-200/90 dark:border-[#272727] bg-white dark:bg-[#181818]">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727]">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Surgeon Caseload Breakdown</span>
                <span className="text-[11px] text-slate-400 font-normal">Oxford Trust</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              {[
                { code: 'VK', name: 'Mr. V. Kannan', color: 'bg-teal-600' },
                { code: 'RDM', name: 'Mr. R. D. MacDonagh', color: 'bg-cyan-600' },
                { code: 'CI', name: 'Mr. Christopher Jones', color: 'bg-indigo-600' },
                { code: 'OAK', name: 'Mr. Omar A. Khan', color: 'bg-amber-600' },
              ].map((surgeon) => {
                const count = allPatients.filter((p) => p.primarySurgeon === surgeon.code).length;
                const percentage = allPatients.length > 0 ? Math.round((count / allPatients.length) * 100) : 0;
                const isCurrentSurgeon = surgeon.code === currentUser?.surgeonCode;

                return (
                  <div
                    key={surgeon.code}
                    onClick={() => {
                      if (surgeon.code === currentUser?.surgeonCode) {
                        setCaseloadScope('personal');
                      }
                    }}
                    className={`p-2.5 rounded-2xl transition-all duration-200 ${
                      isCurrentSurgeon
                        ? 'bg-teal-50/80 dark:bg-[#1F1F1F] border border-teal-200 dark:border-teal-800 shadow-sm cursor-pointer'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1F1F1F]/50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Surgeon {surgeon.code}</span>
                        {isCurrentSurgeon && (
                          <Badge className="bg-teal-600 text-white text-[9px] px-1.5 py-0 h-4 font-semibold">You</Badge>
                        )}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold [font-variant-numeric:tabular-nums]">
                        {count} cases ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#121212] rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${surgeon.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
