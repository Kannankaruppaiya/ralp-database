'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartPulse, Home, ClipboardList, Calendar, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/patient-login') {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'My Recovery Home', href: '/home', icon: Home },
    { label: 'Questionnaires', href: '/assessment', icon: ClipboardList },
    { label: 'Follow-up Schedule', href: '/follow-up', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-muted text-foreground flex flex-col font-sans">
      {/* Patient Accessible Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-foreground text-base leading-none block">My Prostate Recovery</span>
              <span className="text-[11px] text-primary font-medium">RALP Patient Outcomes Portal</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Clinician Portal Link */}
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 border rounded-lg px-2.5 py-1"
          >
            <span>Clinician Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
        {children}
      </main>

      {/* Patient Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        <p>Oxford Urology Centre — NHS Foundation Trust</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Your responses are securely recorded directly into your hospital surgical outcomes registry.
        </p>
      </footer>
    </div>
  );
}
