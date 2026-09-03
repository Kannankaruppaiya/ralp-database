'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { db } from '@/lib/api-client';
import { usePatients } from '@/hooks/use-patients';
import { AuditLogEntry } from '@/types/audit';
import { ChangeHistory } from '@/components/audit/change-history';
import { AuditEvent } from '@/components/audit/audit-event';
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
  AlertTriangle,
  Lock,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { allPatients, isLoading } = usePatients({ fetchAll: true });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    setMounted(true);
    void Promise.all([db.getAuditLogs(20), db.getIngestionJobs()])
      .then(([logs, jobs]) => {
        setAuditLogs(logs);
        setPendingJobsCount(jobs.filter((j) => j.status === 'review_required').length);
      })
      .catch(() => {});
  }, []);

  const totalPatients = allPatients.length;
  const completeRecords = allPatients.filter((p) => p.completeness.score >= 85).length;
  const averageCompleteness = totalPatients > 0
    ? Math.round(allPatients.reduce((sum, p) => sum + p.completeness.score, 0) / totalPatients)
    : 0;

  // Surgeon statistics aggregation
  const surgeonStats = React.useMemo(() => {
    const stats: Record<string, { total: number; complete: number; sumScore: number }> = {};
    allPatients.forEach((p) => {
      const code = p.primarySurgeon || 'Unassigned';
      if (!stats[code]) {
        stats[code] = { total: 0, complete: 0, sumScore: 0 };
      }
      stats[code].total += 1;
      stats[code].sumScore += p.completeness.score;
      if (p.completeness.score >= 85) stats[code].complete += 1;
    });
    return Object.entries(stats).map(([code, s]) => ({
      code,
      total: s.total,
      avgScore: Math.round(s.sumScore / s.total),
      completeRate: Math.round((s.complete / s.total) * 100),
    }));
  }, [allPatients]);

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
      badge: mounted ? `${auditLogs.length} Events Logged` : 'Audit Active',
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
      />

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cohort</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono [font-variant-numeric:tabular-nums]">
                {isLoading ? '—' : totalPatients}
              </div>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-1 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>Active RALP Records</span>
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 dark:border dark:border-teal-900/60">
              <Database className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Completeness</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono [font-variant-numeric:tabular-nums]">
                {isLoading ? '—' : `${averageCompleteness}%`}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block [font-variant-numeric:tabular-nums]">
                {completeRecords} of {totalPatients} high quality
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border dark:border-emerald-900/60">
              <FileCheck2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Trail Entries</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono [font-variant-numeric:tabular-nums]">
                {mounted ? auditLogs.length : '—'}
              </div>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 block font-medium">
                Full Caldicott Logging
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-[#1F1F1F] dark:text-slate-300 dark:border dark:border-[#272727]">
              <History className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending OCR Jobs</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono [font-variant-numeric:tabular-nums]">
                {mounted ? pendingJobsCount : '—'}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block font-medium">
                Requires clinical review
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 dark:border dark:border-amber-900/60">
              <FileUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="bg-[#181818] border border-[#272727]">
          <TabsTrigger value="modules">Administrative Modules</TabsTrigger>
          <TabsTrigger value="activity">Live Audit Stream</TabsTrigger>
          <TabsTrigger value="surgeons">Surgeon Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.href}
                  className="border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all duration-200 shadow-sm group flex flex-col justify-between dark:border-[#272727] dark:bg-[#181818] dark:hover:border-[#313131]"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200 dark:bg-teal-950/60 dark:text-teal-400 dark:border dark:border-teal-900/60">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={card.badgeVariant} className="text-[10px]">
                        {card.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors [text-wrap:balance]">
                      {card.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4 flex flex-col flex-1">
                    <p className="text-xs text-slate-500 leading-relaxed min-h-[36px] [text-wrap:pretty]">
                      {card.description}
                    </p>

                    <div className="mt-auto pt-2">
                      <Link href={card.href} className="block">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-between text-xs font-semibold group-hover:bg-teal-50 group-hover:text-teal-900 group-hover:border-teal-300 dark:group-hover:bg-[#1F1F1F] dark:group-hover:text-teal-300 transition-colors duration-200"
                        >
                          <span>Open Management</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ChangeHistory
            events={auditLogs}
            onSelectEvent={(event) => setSelectedEvent(event)}
          />
        </TabsContent>

        <TabsContent value="surgeons" className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Consultant Surgeon Caseload & Data Completeness
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {surgeonStats.length} Consultant Leads
              </Badge>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                {surgeonStats.map((stat) => (
                  <div
                    key={stat.code}
                    className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#121212] border border-slate-200 dark:border-[#272727] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-400">
                          {stat.code}
                        </span>
                        <span className="text-xs text-slate-500 [font-variant-numeric:tabular-nums]">
                          ({stat.total} total cases)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs [font-variant-numeric:tabular-nums]">
                        <span className="text-slate-500">Quality: <strong className="text-slate-900 dark:text-white">{stat.avgScore}%</strong></span>
                        <Badge variant={stat.avgScore >= 85 ? 'success' : 'warning'} className="text-[10px]">
                          {stat.completeRate}% Compliant
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-[#1F1F1F] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-teal-600 dark:bg-teal-500 transition-all duration-700"
                        style={{ width: `${stat.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audit Event Inspector */}
      {selectedEvent && (
        <AuditEvent
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
