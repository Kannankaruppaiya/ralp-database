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
  HeartPulse,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLINICIAN_NAVIGATION } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
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
    : 'NHS';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md shadow-teal-600/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white leading-none block">RALP Registry</span>
            <span className="text-[10px] font-semibold tracking-wider text-teal-600 uppercase">Surgical Database v2</span>
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
                      ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn('text-slate-400 group-hover:text-teal-600 transition-colors', isActive && 'text-teal-600 dark:text-teal-400')}>
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
      </div>

      {/* User Session Footer with Sign Out */}
      <div className="border-t border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 font-bold text-xs text-white shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {user?.name || 'Signed In'}
              </p>
              <p className="truncate text-[10px] text-slate-500 font-medium">
                {user?.role ? `${user.role}${user.surgeonCode ? ` (${user.surgeonCode})` : ''}` : 'NHS Staff'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleSignOut()}
            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 gap-1 text-[11px] shrink-0"
            title="Sign out of RALP Database"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
