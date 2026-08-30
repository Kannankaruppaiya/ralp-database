'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  History,
  FileCheck2,
  Settings,
  Download,
  ArrowLeft,
  Server,
  Lock,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const ADMIN_NAV_ITEMS = [
  {
    title: 'Admin Overview',
    href: '/admin',
    icon: Server,
    description: 'System health, registry metrics & alerts',
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Staff accounts, surgeon codes & credentials',
  },
  {
    title: 'Role Permissions',
    href: '/admin/roles',
    icon: ShieldCheck,
    description: 'RBAC access control & Caldicott tiers',
  },
  {
    title: 'Caldicott Audit Trail',
    href: '/admin/audit-log',
    icon: History,
    description: 'Immutable access & mutation logs',
  },
  {
    title: 'Data Quality & NPCA',
    href: '/admin/data-quality',
    icon: FileCheck2,
    description: 'Completeness scores & validation rules',
  },
  {
    title: 'System & Trust Config',
    href: '/admin/settings',
    icon: Settings,
    description: 'Surgeon codes, MRN formats & PROM schedules',
  },
  {
    title: 'Registry Exports & Backups',
    href: '/admin/exports',
    icon: Download,
    description: 'NPCA batch export & database snapshots',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
      {/* Brand Header — Admin Console */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white leading-none block">Admin Portal</span>
            <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase">Trust Governance</span>
          </div>
        </Link>
        <Badge variant="outline" className="border-blue-300 text-blue-700 text-[10px] font-mono">
          ROOT
        </Badge>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            System Administration
          </p>
          <nav className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors', isActive && 'text-blue-600 dark:text-blue-400')} />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Switch back to Clinician Portal */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-2 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-300">
            <HeartPulse className="h-4 w-4 text-blue-600" />
            <span>Clinician Registry Portal</span>
          </div>
          <p className="text-[11px] text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
            Return to patient records, theatre operative logging, and PROMs tracking.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white py-1.5 text-xs font-medium transition-colors shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Switch to Clinician Portal</span>
          </Link>
        </div>
      </div>

      {/* Admin User Footer */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            DE
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">David Evans</p>
            <p className="truncate text-[11px] text-slate-500">Caldicott Guardian / Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
