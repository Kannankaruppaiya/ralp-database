'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';
import { usePatients } from '@/hooks/use-patients';
import {
  ClipboardCheck,
  FileText,
  UserX,
  ShieldAlert,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

export default function ReviewQueuePage() {
  const { jobs } = useIngestionJobs();
  const { allPatients } = usePatients({ fetchAll: true });
  const [activeTab, setActiveTab] = useState<'all' | 'extractions' | 'unmatched' | 'conflicts' | 'missing'>('all');

  const pendingExtractions = jobs.filter((j) => j.status === 'review_required');
  const unmatchedDocs = jobs.filter((j) => !j.matchedPatient || j.matchedPatient.matchScore < 90);
  const conflictingJobs = jobs.filter((j) => j.conflictCount > 0);
  const missingDataPatients = allPatients.filter(
    (p) => !p.completeness.baselineComplete || !p.completeness.histologyComplete
  );

  const totalItems = pendingExtractions.length + unmatchedDocs.length + conflictingJobs.length + missingDataPatients.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Review & Verification Queue"
        description="Unified clinical triage hub for staged documents, identity matching, and conflict resolution"
        breadcrumbs={[{ label: 'Review Queue' }]}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('extractions')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'extractions'
              ? 'border-primary bg-primary/10/50 dark:bg-teal-950/30 ring-2 ring-ring/30'
              : 'border-border bg-card hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Extraction Review</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-white mt-1">
            {pendingExtractions.length}
          </div>
          <span className="text-[11px] text-primary font-medium">Awaiting sign-off</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unmatched')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'unmatched'
              ? 'border-category bg-category-muted/50 dark:bg-purple-950/30 ring-2 ring-category/30'
              : 'border-border bg-card hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Unmatched Docs</span>
            <UserX className="h-4 w-4 text-category-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-white mt-1">
            {unmatchedDocs.length}
          </div>
          <span className="text-[11px] text-category-muted-foreground font-medium">Needs patient link</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conflicts')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'conflicts'
              ? 'border-warning bg-warning-muted/50 dark:bg-amber-950/30 ring-2 ring-warning/30'
              : 'border-border bg-card hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Conflicts</span>
            <ShieldAlert className="h-4 w-4 text-warning-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-white mt-1">
            {conflictingJobs.length}
          </div>
          <span className="text-[11px] text-warning-muted-foreground font-medium">Data discrepancies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'missing'
              ? 'border-destructive bg-destructive/10/50 dark:bg-rose-950/30 ring-2 ring-destructive/30'
              : 'border-border bg-card hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Missing Data</span>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-white mt-1">
            {missingDataPatients.length}
          </div>
          <span className="text-[11px] text-destructive font-medium">Incomplete records</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border dark:border-slate-800 pb-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
          className="text-xs"
        >
          All Items ({totalItems})
        </Button>
        <Button
          variant={activeTab === 'extractions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('extractions')}
          className="text-xs"
        >
          Extractions ({pendingExtractions.length})
        </Button>
        <Button
          variant={activeTab === 'unmatched' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('unmatched')}
          className="text-xs"
        >
          Unmatched ({unmatchedDocs.length})
        </Button>
        <Button
          variant={activeTab === 'conflicts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('conflicts')}
          className="text-xs"
        >
          Conflicts ({conflictingJobs.length})
        </Button>
        <Button
          variant={activeTab === 'missing' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('missing')}
          className="text-xs"
        >
          Missing Fields ({missingDataPatients.length})
        </Button>
      </div>

      {/* Active Triage Content List */}
      <div className="space-y-4">
        {/* Extractions List */}
        {(activeTab === 'all' || activeTab === 'extractions') && pendingExtractions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Pending Document Extractions ({pendingExtractions.length})</span>
            </h3>
            {pendingExtractions.map((job) => (
              <Card key={job.id} className="shadow-sm hover:border-teal-400 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-teal-950 dark:text-teal-400 flex-shrink-0">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground dark:text-slate-100">
                        {job.documentTitle}
                      </h4>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span>Matched: <strong>{job.matchedPatient?.fullName || 'Auto-matching'}</strong></span>
                        <span>•</span>
                        <span>{job.extractedFields.length} extracted fields</span>
                        <span>•</span>
                        <span className="text-primary font-semibold">{job.sourceType.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/data-ingestion/extraction-review">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <span>Review Extraction</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Conflicts List */}
        {(activeTab === 'all' || activeTab === 'conflicts') && conflictingJobs.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning-muted-foreground" />
              <span>Conflicting Clinical Data Points ({conflictingJobs.length})</span>
            </h3>
            {conflictingJobs.map((job) => (
              <Card key={`conflict-${job.id}`} className="border-warning/20 bg-warning-muted/20 shadow-sm dark:border-amber-900/40">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-muted text-warning-muted-foreground dark:bg-amber-950 dark:text-amber-300 flex-shrink-0">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-warning-muted-foreground dark:text-amber-200">
                        {job.documentTitle} — Discrepancy in Blood Loss / Duration
                      </h4>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5">
                        Patient: <strong>{job.matchedPatient?.fullName}</strong> • Extracted value differs from current database record
                      </p>
                    </div>
                  </div>

                  <Link href="/data-ingestion/conflicts">
                    <Button size="sm" variant="default" className="text-xs gap-1.5 bg-warning hover:bg-amber-700">
                      <span>Reconcile Conflict</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Missing Data Patients */}
        {(activeTab === 'all' || activeTab === 'missing') && missingDataPatients.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Missing Clinical Datasets in Cohort ({missingDataPatients.length})</span>
            </h3>
            {missingDataPatients.map((patient) => (
              <Card key={`missing-${patient.id}`} className="border-destructive/20 shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive dark:bg-rose-950 dark:text-rose-400 flex-shrink-0">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground dark:text-slate-100">
                        {patient.firstName} {patient.surname} (NHS: {patient.nhsNumber}, MRN: {patient.hospitalNumber})
                      </h4>
                      <div className="text-xs text-destructive flex items-center gap-2 mt-0.5">
                        <span>Missing: {patient.completeness.missingFields.join(' • ')}</span>
                        <span>•</span>
                        <span>Completeness: {patient.completeness.score}%</span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/patients/${patient.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <span>Complete Record</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
