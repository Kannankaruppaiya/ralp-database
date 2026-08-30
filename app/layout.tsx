import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RALP Database v2 — Surgical Outcomes & PROMs Platform',
  description:
    'Advanced Robot-Assisted Laparoscopic Prostatectomy (RALP) outcomes database, automated data ingestion, longitudinal IPSS/SHIM scoring, and surgeon benchmarking platform.',
};

import { PerformanceHud } from '@/components/performance/performance-hud';
import { EnvBanner } from '@/components/layout/env-banner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-muted text-foreground antialiased selection:bg-teal-500 selection:text-white font-sans">
        <EnvBanner />
        {children}
        <PerformanceHud />
      </body>
    </html>
  );
}
