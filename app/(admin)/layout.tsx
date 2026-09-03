'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] dark:bg-[#121212] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      <AdminSidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <AdminTopbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
