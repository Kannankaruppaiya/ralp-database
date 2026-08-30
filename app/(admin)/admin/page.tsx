'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/api-client';
import { usePatients } from '@/hooks/use-patients';
import {
  Users,
  ShieldCheck,
  History,
  FileCheck2,
  Settings,
  Download,
  ArrowRight,
  Database,
  CheckCircle2,
  FileUp,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { allPatients, isLoading } = usePatients({ fetchAll: true });
  const [auditLogCount, setAuditLogCount] = useState(0);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void Promise.all([db.getAuditLogs(), db.getIngestionJobs()])
      .then(([logs, jobs]) => {
        setAuditLogCount(logs.length);
        setPendingJobsCount(jobs.filter((j) => j.status === 'review_required').length);
      })
      .catch(() => {});
  }, []);

  const totalPatients = allPatients.length;
  const completeRecords = allPatients.filter((p) => p.completeness.score >= 85).length;
  const averageCompleteness = totalPatients > 0
    ? Math.round(allPatients.reduce((sum, p) => sum + p.completeness.score, 0) / totalPatients)
    : 0;

  const adminCards = [
    {
      title: 'User & Staff Management',
      description: 'Configure consultant surgeon codes (VK, RDM, CI, OAK), oncology nurses, and data clerk permissions.',
      href: '/admin/users',
      icon: Users,
      badge: '6 Active Staff',
      badgeVariant: 'info' as const,
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      description: 'Audit Caldicott Guardian tiers, MDT access privileges, and pseudonymized research export roles.',
      href: '/admin/roles',
      icon: ShieldCheck,
      badge: '4 Roles Configured',
      badgeVariant: 'success' as const,
    },
    {
      title: 'NHS Caldicott Audit Trail',
      description: 'Immutable access log recording patient record views, updates, and GDPR/Caldicott data exports.',
      href: '/admin/audit-log',
      icon: History,
      badge: mounted ? `${auditLogCount} Events Logged` : 'Audit Active',
      badgeVariant: 'default' as const,
    },
    {
      title: 'NPCA & Data Quality Engine',
      description: 'Automated audit rules for National Prostate Cancer Audit (NPCA) submission readiness.',
      href: '/admin/data-quality',
      icon: FileCheck2,
      badge: `${averageCompleteness}% Cohort Index`,
      badgeVariant: averageCompleteness >= 80 ? ('success' as const) : ('warning' as const),
    },
    {
      title: 'Trust & System Configuration',
      description: 'Configure hospital MRN formatting, robot console types, and automated PROM dispatch intervals.',
      href: '/admin/settings',
      icon: Settings,
      badge: 'Oxford Health NHS',
      badgeVariant: 'outline' as const,
    },
    {
      title: 'National Registry Exports',
      description: 'Download NPCA-compliant CSV/JSON datasets and take snapshot backups of the registry database.',
      href: '/admin/exports',
      icon: Download,
      badge: 'NPCA Batch Ready',
      badgeVariant: 'purple' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registry Administration Command Center"
        description="System administration, user access management, Caldicott audit logs, and data quality controls"
        breadcrumbs={[{ label: 'Admin Console' }]}
        action={
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs">
              Return to Clinician Portal
            </Button>
          </Link>
        }
      />

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cohort</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {isLoading ? '—' : totalPatients}
              </div>
              <span className="text-[11px] text-blue-600 flex items-center gap-1 mt-1 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>Active RALP Records</span>
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Database className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Completeness</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {isLoading ? '—' : `${averageCompleteness}%`}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {completeRecords} of {totalPatients} high quality
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <FileCheck2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Trail Entries</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {mounted ? auditLogCount : '—'}
              </div>
              <span className="text-[11px] text-blue-600 mt-1 block font-medium">
                Full Caldicott Logging
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <History className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending OCR Jobs</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {mounted ? pendingJobsCount : '—'}
              </div>
              <span className="text-[11px] text-amber-600 mt-1 block font-medium">
                Requires clinical review
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <FileUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Modules Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Administrative Modules & Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.href}
                className="border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition-all duration-200 shadow-sm group flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-blue-950 dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={card.badgeVariant} className="text-[10px]">
                      {card.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-blue-700 transition-colors">
                    {card.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {card.description}
                  </p>

                  <Link href={card.href} className="block">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-between text-xs group-hover:bg-blue-50 group-hover:text-blue-900 group-hover:border-blue-300 transition-colors"
                    >
                      <span>Open Management</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
