'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ExternalLink,
} from 'lucide-react';
import { cn, initialsFrom } from '@/lib/utils';
import { CLINICIAN_NAVIGATION } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { useSession, signOut } from '@/lib/auth';

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
  const router = useRouter();
  const { user } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white leading-none block">RALP Registry</span>
            <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase">Surgical Database v2</span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn('text-slate-400 group-hover:text-blue-600 transition-colors', isActive && 'text-blue-600 dark:text-blue-400')}>
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
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-300">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>Patient Portal View</span>
            </div>
            <Link
              href="/home"
              target="_blank"
              className="text-blue-700 hover:text-blue-900 dark:text-blue-400"
              title="Open Patient Portal in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-blue-800/80 dark:text-blue-400/80">
            Preview patient digital PROMs questionnaire experience.
          </p>
          <Link
            href="/home"
            className="mt-2.5 inline-flex w-full items-center justify-center rounded-md bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
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
            <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 text-[9px] font-mono">
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
      <div className="border-t border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-xs text-white shadow-sm">
              {user ? initialsFrom(user.name) : '··'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {user ? user.name : 'Signed out'}
              </p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {user
                  ? `${user.role}${user.surgeonCode ? ` (${user.surgeonCode})` : ''}`
                  : 'No active session'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
