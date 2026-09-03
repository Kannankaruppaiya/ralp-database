'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="no-print print:hidden">
        <Sidebar />
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      </div>

      <div className="flex flex-col md:pl-64 print:pl-0 min-h-screen">
        <div className="no-print print:hidden">
          <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        </div>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200 focus:outline-none print:p-0 print:max-w-none print:m-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
