'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/hooks/use-patients';
import { useFollowUps } from '@/hooks/use-follow-ups';
import { formatDate, formatPsa } from '@/lib/formatters';
import { useSession } from '@/lib/auth';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';
import {
  Users,
  CalendarClock,
  AlertCircle,
  FileUp,
  Scissors,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Plus,
  ShieldCheck,
  Activity,
  FileText,
  UserCheck,
  Stethoscope,
  Sparkles,
  Layers,
  HeartPulse,
} from 'lucide-react';

const OutcomeChart = dynamic(
  () => import('@/components/analytics/outcome-chart').then((m) => ({ default: m.OutcomeChart })),
  {
    loading: () => (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm h-72 animate-pulse dark:border-slate-800 dark:bg-slate-900" />
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
  const isSurgeon = currentUser?.role === 'Consultant Surgeon' && !!currentUser.surgeonCode;
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
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {currentUser?.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentUser?.name} {currentUser?.surgeonCode && `(${currentUser?.surgeonCode})`}
              </h2>
              <Badge variant="outline" className="text-xs bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300">
                {currentUser?.role}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.hospital} • {caseloadScope === 'personal' && targetSurgeonCode ? `Showing your personal caseload (${targetSurgeonCode})` : 'Showing full hospital registry (All Surgeons)'}
            </p>
          </div>
        </div>

        {/* Caseload Toggle */}
        <div className="flex items-center gap-2">
          {targetSurgeonCode && (
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCaseloadScope('personal')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  caseloadScope === 'personal'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                My Caseload ({targetSurgeonCode})
              </button>
              <button
                type="button"
                onClick={() => setCaseloadScope('trust')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  caseloadScope === 'trust'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Whole Trust ({allPatients.length.toLocaleString()})
              </button>
            </div>
          )}

          <Link href="/patients/new">
            <Button size="sm" className="gap-1.5 shadow-sm text-xs h-9">
              <Plus className="h-4 w-4" />
              <span>Register Patient</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Role-Specific Smart Banners */}
      {currentUser?.role === 'Clinical Nurse Specialist' && (
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeartPulse className="h-5 w-5 text-purple-600" />
            <div>
              <div className="text-xs font-bold text-purple-950 dark:text-purple-200">Specialist Nursing Triage Dashboard Active</div>
              <div className="text-[11px] text-purple-700 dark:text-purple-400">Highlighting TWOC catheter removals, incontinence rehabilitation, and PROM non-responder triage.</div>
            </div>
          </div>
          <Link href="/follow-ups/overdue">
            <Button size="sm" variant="outline" className="text-xs border-purple-300 text-purple-800 hover:bg-purple-100">
              Review Nurse Triage Queue
            </Button>
          </Link>
        </div>
      )}

      {currentUser?.role === 'Surgical Registrar' && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xs font-bold text-blue-950 dark:text-blue-200">Trainee Surgical Logbook Active</div>
              <div className="text-[11px] text-blue-700 dark:text-blue-400">Tracking supervised robotic console minutes, vesicourethral anastomosis (VUA) time, and training case validations.</div>
            </div>
          </div>
          <Link href="/data-ingestion/upload">
            <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-800 hover:bg-blue-100">
              Submit Op Log
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Top Stat Cards (Dynamically scoped to the logged-in user!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-600 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {caseloadScope === 'personal' && targetSurgeonCode ? `${targetSurgeonCode} Patients` : 'Total Cohort'}
            </span>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCohort}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {caseloadScope === 'personal' && targetSurgeonCode ? `Managed by ${currentUser?.name}` : 'RALP surgical cohort'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Follow-ups</span>
            <CalendarClock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{displayDue.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Scheduled in next 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Alerts</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-rose-600">{displayOverdue.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Missing PSA / PROM data</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registry Completeness</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgCompleteness}%</div>
            <p className="text-[11px] text-slate-500 mt-1">Caseload quality score</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Overdue Follow-ups + Ingestion & Caseload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Follow-ups Queue (Left 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="p-5 pb-3 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  <span>
                    Action Required: Overdue Follow-ups ({displayOverdue.length})
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {caseloadScope === 'personal' && targetSurgeonCode
                    ? `Patients under ${currentUser?.name} pending review`
                    : 'Patients pending milestone review across all surgeons'}
                </p>
              </div>
              <Link href="/follow-ups/overdue">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {displayOverdue.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  No overdue follow-up milestones for this caseload.
                </div>
              ) : (
                displayOverdue.slice(0, 4).map((fu) => (
                  <div key={fu.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div>
                      <Link href={`/patients/${fu.patient.id}`} className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-teal-600">
                        {fu.patient.firstName} {fu.patient.surname}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">MRN: {fu.patient.hospitalNumber}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px]">{fu.milestone.toUpperCase()} ({fu.targetMonths}m)</Badge>
                        <span>•</span>
                        <span>Surgeon: {fu.patient.primarySurgeon}</span>
                      </div>
                    </div>
                    <Link href={`/patients/${fu.patient.id}/follow-ups`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
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

        {/* Sidebar Cards: Pending Ingestion & Fast Registration */}
        <div className="space-y-6">
          {/* Pending Ingestion Card */}
          <Card className="border-teal-200 bg-teal-50/20 dark:border-teal-900/50 shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-teal-950 dark:text-teal-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-teal-600" />
                  Document Ingestion
                </span>
                <Badge variant="warning">{pendingJobs.length} Pending</Badge>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Theatre notes & clinic letters awaiting review
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {pendingJobs.map((job) => (
                <div key={job.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-teal-100 dark:border-teal-900 text-xs space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {job.documentTitle}
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{job.extractedFields.length} fields extracted</span>
                    <span className="text-amber-600 font-semibold">{job.conflictCount} conflict</span>
                  </div>
                  <Link href="/data-ingestion/extraction-review" className="block">
                    <Button size="sm" className="w-full text-xs h-7">
                      Review & Approve
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Surgeons Cohort Breakdown */}
          <Card className="shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Surgeon Caseload Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-xs">
              {['VK', 'RDM', 'CI', 'OAK'].map((code) => {
                const count = allPatients.filter((p) => p.primarySurgeon === code).length;
                const percentage = allPatients.length > 0 ? Math.round((count / allPatients.length) * 100) : 0;
                const isCurrentSurgeon = code === currentUser?.surgeonCode;

                return (
                  <div
                    key={code}
                    onClick={() => {
                      if (code === currentUser?.surgeonCode) {
                        setCaseloadScope('personal');
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      isCurrentSurgeon ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold">Surgeon {code}</span>
                        {isCurrentSurgeon && (
                          <Badge className="bg-teal-600 text-white text-[9px] px-1.5 py-0 h-4">You</Badge>
                        )}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{count} cases ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 dark:bg-slate-800">
                      <div
                        className={`h-1.5 rounded-full ${isCurrentSurgeon ? 'bg-teal-600' : 'bg-slate-400'}`}
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
