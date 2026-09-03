import type { Metadata } from 'next';
import './globals.css';
import { EnvBanner } from '@/components/layout/env-banner';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'RALP Database v2 — Surgical Outcomes & PROMs Platform',
  description:
    'Advanced Robot-Assisted Laparoscopic Prostatectomy (RALP) outcomes database, automated data ingestion, longitudinal IPSS/SHIM scoring, and surgeon benchmarking platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-[100dvh] bg-[#FAFAFA] text-slate-900 dark:bg-[#121212] dark:text-slate-100 antialiased selection:bg-teal-600 selection:text-white font-sans">
        <ThemeProvider defaultTheme="dark">
          <EnvBanner />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
