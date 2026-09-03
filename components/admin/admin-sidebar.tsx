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
  Server,
  Lock,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <aside
      aria-label="Admin Governance Sidebar"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white dark:border-[#272727] dark:bg-[#121212] md:flex"
    >
      {/* Brand Header — Admin Console */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5 dark:border-[#272727]">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors duration-200">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm leading-none block">Admin Console</span>
            <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">Trust Governance</span>
          </div>
        </Link>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
          ROOT
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        <div>
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                    'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    isActive
                      ? 'bg-indigo-50 text-indigo-950 dark:bg-[#181818] dark:text-indigo-300 border-l-2 border-indigo-600 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#181818] dark:hover:text-slate-100'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200',
                        isActive && 'text-indigo-600 dark:text-indigo-400'
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Admin User Footer with Sign Out */}
      <div className="border-t border-slate-200/80 p-3 dark:border-[#272727] bg-slate-50/50 dark:bg-[#181818]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-xs text-white shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {user?.name || 'Administrator'}
              </p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {user?.role || 'Data Governance Manager'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            aria-label="Sign out of Admin Console"
            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shrink-0"
            title="Sign out of Admin Console"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
