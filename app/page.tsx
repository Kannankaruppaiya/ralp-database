'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  HeartPulse,
  Stethoscope,
  Users,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';

export default function RootHomePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#FAFAFA] dark:bg-[#121212] text-slate-900 dark:text-slate-100">
      {/* Floating Island Style Header */}
      <header className="sticky top-4 z-30 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-5 h-16 flex items-center justify-between shadow-sm backdrop-blur-md dark:border-[#272727] dark:bg-[#181818]/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/20">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm leading-none block">
                RALP Database <span className="text-teal-600 dark:text-teal-400 font-mono text-xs">v2.0</span>
              </span>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Surgical Outcomes & PROMs Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#272727] text-slate-600 dark:text-slate-300 text-xs font-semibold">
              <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Oxford Urology</span>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            <Link href="/dashboard">
              <Button size="sm" className="shadow-sm text-xs font-semibold h-8 px-3">
                Open Registry
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col justify-center space-y-12">
        <div className="text-center max-w-[680px] mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Oxford Urology Robotic Surgery Quality Registry</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] text-slate-900 dark:text-white [text-wrap:balance]">
            Robot-Assisted Laparoscopic Prostatectomy{' '}
            <span className="hero-gradient-text block sm:inline">
              Outcomes Database
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed [text-wrap:pretty]">
            Standardized multi-surgeon clinical registry tracking baseline oncology, theatre operative parameters, post-op histopathology, and longitudinal 3-year PROMs.
          </p>
        </div>

        {/* Asymmetric Portals Grid (1 Featured + 2 Supporting) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto w-full items-stretch">
          {/* Featured Primary Card: Clinician Registry Portal (7 Cols) */}
          <Card className="lg:col-span-7 border-slate-200/80 dark:border-[#272727] bg-white dark:bg-[#181818] flex flex-col justify-between group hover:border-teal-500/60 dark:hover:border-teal-500/60 transition-all duration-300">
            <CardContent className="p-6 sm:p-8 flex flex-col h-full justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    Consultants & Surgeons
                  </Badge>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                    Clinician Registry Portal
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed [text-wrap:pretty]">
                    Patient longitudinal records, theatre operative logging, post-op histology (pTNM), surgeon benchmarking, and automated clinic summaries.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-[#272727]">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1F1F1F] space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Oncology</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">PSA & Gleason</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1F1F1F] space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Operative</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Nerve Sparing</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1F1F1F] space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Follow-up</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">7 Milestones</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <Link href="/login" className="block">
                  <Button className="w-full h-10 gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm text-sm font-semibold">
                    <span>Enter Clinician Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Right Column Stack: Patient Recovery + Admin (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Patient Portal Card */}
            <Card className="border-slate-200/80 dark:border-[#272727] bg-white dark:bg-[#181818] flex flex-col justify-between group hover:border-purple-500/60 dark:hover:border-purple-500/60 transition-all duration-300">
              <CardContent className="p-6 flex flex-col h-full justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                      <Users className="h-5 w-5" />
                    </div>
                    <Badge variant="purple" className="text-[10px]">
                      Patient Cohort
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                      Patient Recovery Portal
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Digital PROMs questionnaires (IPSS urinary scores, SHIM potency index, pad count continence) with automatic clinical sync.
                    </p>
                  </div>
                </div>

                <div className="pt-2 mt-auto">
                  <Link href="/patient-login" className="block">
                    <Button variant="outline" className="w-full h-9 gap-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold">
                      <span>Enter Patient Portal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Dedicated Admin Portal Card */}
            <Card className="border-slate-200/80 dark:border-[#272727] bg-white dark:bg-[#181818] flex flex-col justify-between group hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-all duration-300">
              <CardContent className="p-6 flex flex-col h-full justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-[10px]">
                      Governance
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                      Administration & Audit Gateway
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      User provisioning, surgeon codes, RBAC roles, immutable Caldicott audit trail, and NPCA registry exports.
                    </p>
                  </div>
                </div>

                <div className="pt-2 mt-auto">
                  <Link href="/admin-login" className="block">
                    <Button variant="outline" className="w-full h-9 gap-2 border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold">
                      <span>Enter Admin Gateway</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Trust Governance Footer */}
      <footer className="border-t border-slate-200/80 dark:border-[#272727] bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Oxford University Hospitals NHS Foundation Trust • Department of Urology</span>
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px]">
            <span>NHS Information Governance</span>
            <span>•</span>
            <span>Caldicott Compliant</span>
            <span>•</span>
            <span>NPCA Audit Aligned</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
