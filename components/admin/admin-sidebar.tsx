import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from '@/lib/auth';

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
  const router = useRouter();
  const { user } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/admin-login');
      router.refresh();
    } catch {
      router.push('/admin-login');
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
      {/* Brand Header — Admin Console */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md shadow-teal-600/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white leading-none block">Admin Portal</span>
            <span className="text-[10px] font-semibold tracking-wider text-teal-600 uppercase">Trust Governance</span>
          </div>
        </Link>
        <Badge variant="outline" className="border-teal-300 text-teal-700 text-[10px] font-mono">
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
                      ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4 text-slate-400 group-hover:text-teal-600 transition-colors', isActive && 'text-teal-600 dark:text-teal-400')} />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Switch back to Clinician Portal */}
        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 space-y-2 dark:border-teal-900/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-300">
            <HeartPulse className="h-4 w-4 text-teal-600" />
            <span>Clinician Registry Portal</span>
          </div>
          <p className="text-[11px] text-teal-800/80 dark:text-teal-400/80 leading-relaxed">
            Return to patient records, theatre operative logging, and PROMs tracking.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white py-1.5 text-xs font-medium transition-colors shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Switch to Clinician Portal</span>
          </Link>
        </div>
      </div>

      {/* Admin User Footer with Sign Out */}
      <div className="border-t border-slate-200 p-3.5 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-xs text-white shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {user?.name || 'Administrator'}
              </p>
              <p className="truncate text-[10px] text-slate-500 font-medium">
                {user?.role || 'Data Manager'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleSignOut()}
            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 gap-1 text-[11px] shrink-0"
            title="Sign out of Admin Console"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
