'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileUp,
  ClipboardCheck,
  FileText,
  BarChart3,
  ShieldCheck,
  Activity,
  HeartPulse,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLINICIAN_NAVIGATION } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  CalendarClock: <CalendarClock className="h-4 w-4" />,
  FileUp: <FileUp className="h-4 w-4" />,
  ClipboardCheck: <ClipboardCheck className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4" />,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-sidebar-foreground leading-none block">RALP Registry</span>
            <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">Surgical Database v2</span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Clinical Registry
          </p>
          <nav className="space-y-1">
            {CLINICIAN_NAVIGATION.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn('text-muted-foreground group-hover:text-primary transition-colors', isActive && 'text-primary')}>
                      {item.icon && ICON_MAP[item.icon]}
                    </span>
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="warning" className="h-5 px-1.5 text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Patient Portal Switcher Link */}
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Activity className="h-4 w-4 text-primary" />
              <span>Patient Portal View</span>
            </div>
            <Link
              href="/home"
              target="_blank"
              className="text-primary hover:text-primary/80"
              title="Open Patient Portal in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-primary/80">
            Preview patient digital PROMs questionnaire experience.
          </p>
          <Link
            href="/home"
            className="mt-2.5 inline-flex w-full items-center justify-center rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Launch Patient App
          </Link>
        </div>

        {/* Dedicated Admin Portal Switcher */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-300">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Admin Portal (Separate)</span>
            </div>
            <Badge variant="outline" className="border-indigo-300 text-indigo-700 text-[9px] font-mono">
              RBAC
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-indigo-900/70 dark:text-indigo-300/70">
            User management, Caldicott audit logs & NPCA data quality controls.
          </p>
          <Link
            href="/admin"
            className="mt-2.5 inline-flex w-full items-center justify-center rounded-md bg-indigo-700 py-1.5 text-xs font-medium text-white hover:bg-indigo-800 transition-colors shadow-sm"
          >
            Open Admin Portal
          </Link>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="border-t border-sidebar-border p-3.5 bg-muted/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-xs text-primary-foreground shadow-sm">
              VK
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-foreground">Mr. V. Kannan</p>
              <p className="truncate text-[10px] text-muted-foreground font-medium">Consultant Surgeon (VK)</p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-[11px] font-semibold text-primary hover:text-primary/80 p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Switch User / Sign Out"
          >
            Switch
          </Link>
        </div>
      </div>
    </aside>
  );
}
