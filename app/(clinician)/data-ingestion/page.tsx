'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUp, FileText, UserCheck, ShieldAlert, ArrowRight, UploadCloud, CheckCircle2 } from 'lucide-react';
import { useIngestionJobs } from '@/hooks/use-ingestion-jobs';

export default function DataIngestionPage() {
  const { jobs } = useIngestionJobs();
  const pendingJobs = jobs.filter((j) => j.status === 'review_required');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated Data Ingestion & OCR Hub"
        description="Ingest theatre operation notes and clinic letters to automatically populate the RALP database"
        breadcrumbs={[{ label: 'Data Ingestion' }]}
        action={
          <Link href="/data-ingestion/upload">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <UploadCloud className="h-4 w-4" />
              <span>Upload New Document</span>
            </Button>
          </Link>
        }
      />

      {/* Quick Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/data-ingestion/upload" className="group">
          <Card className="h-full hover:border-teal-500 transition-colors shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-teal-950 dark:text-teal-400 group-hover:scale-105 transition-transform">
                <FileUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground dark:text-slate-100">1. Upload Documents</h3>
              <p className="text-xs text-muted-foreground">Word (.docx), PDF, or Google Form CSV outputs</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/data-ingestion/extraction-review" className="group">
          <Card className="h-full hover:border-teal-500 transition-colors shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-muted text-info-muted-foreground dark:bg-cyan-950 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground dark:text-slate-100">2. Extraction Review</h3>
              <p className="text-xs text-muted-foreground">AI field-by-field verification and confidence rating</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/data-ingestion/patient-matching" className="group">
          <Card className="h-full hover:border-teal-500 transition-colors shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground dark:text-slate-100">3. Patient Matching</h3>
              <p className="text-xs text-muted-foreground">Match extracted data to NHS number or hospital MRN</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/data-ingestion/conflicts" className="group">
          <Card className="h-full hover:border-teal-500 transition-colors shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-muted text-warning-muted-foreground dark:bg-amber-950 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground dark:text-slate-100">4. Conflict Resolver</h3>
              <p className="text-xs text-muted-foreground">Side-by-side reconciliation of conflicting values</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Pending Ingestion Jobs Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-5 pb-3 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold text-foreground dark:text-white">
              Active Extraction Jobs ({jobs.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">Recent documents submitted for automated registry population</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border dark:divide-slate-800">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 flex items-center justify-between hover:bg-muted dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-teal-950 dark:text-teal-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground dark:text-slate-100">{job.documentTitle}</h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>Type: {job.sourceType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{job.extractedFields.length} fields extracted</span>
                    <span>•</span>
                    <span className="font-medium text-primary">Patient: {job.matchedPatient?.fullName || 'Auto-matching'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={job.status === 'approved' ? 'success' : 'warning'}>
                  {job.status === 'approved' ? 'Approved' : 'Review Required'}
                </Badge>
                <Link href="/data-ingestion/extraction-review">
                  <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                    <span>Review</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
