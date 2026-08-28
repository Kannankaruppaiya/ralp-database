'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HeartPulse,
  Stethoscope,
  Users,
  FileUp,
  BarChart3,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function RootHomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100">
      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-none block">RALP Database v2</span>
              <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">Surgical Outcomes Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard">
              <Button size="sm" className="shadow-sm text-xs">Open Registry</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16 flex-1 flex flex-col justify-center space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="success" className="px-3.5 py-1 text-xs shadow-sm">
            Oxford Urology Robotic Surgery Quality Registry
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Robot-Assisted Laparoscopic Prostatectomy <span className="text-teal-600">Outcomes Database</span>
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Standardized multi-surgeon clinical database tracking baseline oncology, theatre operative parameters, post-op histopathology, and longitudinal 3-year PROMs (IPSS, SHIM, Continence).
          </p>
        </div>

        {/* 3 Dedicated Portals Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {/* Clinician Portal Card */}
          <Card className="hover:border-teal-500 hover:shadow-xl transition-all border-slate-200/80 bg-white group flex flex-col justify-between">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-[10px]">Consultants & Surgeons</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Clinician Registry Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Patient longitudinal records, theatre operative logging, post-op histology (pTNM), surgeon benchmarking, and MDT summary reports.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span>Pre-Op PSA & Gleason risk grading</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span>RALP theatre nerve sparing (2/5 to 5/5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span>7-Milestone longitudinal follow-ups</span>
                </div>
              </div>

              <Link href="/login" className="block pt-2">
                <Button className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm text-xs">
                  <span>Enter Clinician Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Patient Portal Card */}
          <Card className="hover:border-purple-500 hover:shadow-xl transition-all border-slate-200/80 bg-white group flex flex-col justify-between">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="purple" className="text-[10px]">Patients Cohort</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Patient Recovery Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Confidential digital PROMs questionnaires (IPSS urinary scores, SHIM potency index, pad count continence) with automatic clinical sync.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>7-Question IPSS Urinary scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>5-Question SHIM Erectile function</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>Longitudinal recovery timeline</span>
                </div>
              </div>

              <Link href="/patient-login" className="block pt-2">
                <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm text-xs">
                  <span>Enter Patient Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Dedicated Admin Portal Card */}
          <Card className="hover:border-indigo-500 hover:shadow-xl transition-all border-slate-200/80 bg-white group flex flex-col justify-between">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">
                  Caldicott & Governance
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Administration Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Dedicated administrative console for user provisioning, surgeon codes, RBAC roles, Caldicott audit logs, and NPCA national data quality audits.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>Staff accounts & surgeon codes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>Immutable Caldicott audit trail</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>NPCA registry exports & snapshots</span>
                </div>
              </div>

              <Link href="/admin-login" className="block pt-2">
                <Button variant="outline" className="w-full gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 shadow-sm text-xs">
                  <span>Enter Admin Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="mt-3 text-center text-[11px] text-slate-500">
                Clinician and patient accounts are provisioned by an administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Trust Governance Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Oxford University Hospitals NHS Foundation Trust — Department of Urology</span>
          <span className="text-slate-400">NHS Information Governance & Caldicott Compliant</span>
        </div>
      </footer>
    </div>
  );
}
