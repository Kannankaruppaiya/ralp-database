'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Droplet,
  Sparkles,
  Activity,
  CheckCircle2,
  Calendar,
  ArrowRight,
  User,
  HeartPulse,
  Award,
  Clock,
} from 'lucide-react';
import { db } from '@/lib/api-client';
import { useCurrentPatient } from '@/lib/auth';
import { PatientFullRecord } from '@/types/patient';
import { formatNhsNumber, formatDate, formatPsa } from '@/lib/formatters';

const SURGEON_NAME_MAP: Record<string, string> = {
  VK: 'Mr. V. Kannan',
  RDM: 'Mr. R. D. MacDonagh',
  CI: 'Mr. Christopher Jones',
  OAK: 'Mr. Omar A. Khan',
};

export default function PatientHomePage() {
  const { patient, isLoading } = useCurrentPatient();

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading your record...</div>;
  }

  if (!patient) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        No patient record is linked to this login. Please contact your clinical team.
      </div>
    );
  }

  const surgeonName = SURGEON_NAME_MAP[patient.primarySurgeon] || `Surgeon ${patient.primarySurgeon}`;
  const opDate = patient.operation?.operationDate ? formatDate(patient.operation.operationDate) : 'Scheduled';
  const stage = patient.histology?.pathologicalStage ? `pT${patient.histology.pathologicalStage}` : (patient.baseline?.clinicalStage || 'pT2 Organ-Confined');
  const gleason = patient.histology?.gleasonGrade || patient.baseline?.gleasonGrade || '3+4';

  // Calculate completed PROMs
  const completedProms = patient.proms || [];
  const hasIpss = completedProms.some((p) => Boolean(p.ipssScore || p.ipssAnswers));
  const hasShim = completedProms.some((p) => Boolean(p.shimScore || p.shimAnswers));
  const hasIncontinence = completedProms.some((p) => Boolean(p.continence));

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="success">Active Recovery Track</Badge>
              <Badge variant="outline" className="font-mono text-xs">
                NHS: {formatNhsNumber(patient.nhsNumber)}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {patient.firstName} {patient.surname}!
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
              Personalized recovery portal for your robotic prostate surgery with <strong className="text-blue-900">{surgeonName}</strong> at Oxford Urology Centre.
            </p>
          </div>

          <Link href="/assessment/ipss">
            <Button size="lg" className="gap-2 shadow-md bg-blue-600 hover:bg-blue-700 text-white">
              <ClipboardList className="h-5 w-5" />
              <span>Start Questionnaire</span>
            </Button>
          </Link>
        </div>

        {/* Patient Clinical Summary Badges */}
        <div className="mt-5 pt-4 border-t border-blue-100/80 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>Surgery Date: <strong>{opDate}</strong></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <Award className="h-3.5 w-3.5 text-blue-600" />
            <span>Pathology: <strong>{stage} (Gleason {gleason})</strong></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <User className="h-3.5 w-3.5 text-blue-600" />
            <span>Consultant: <strong>{surgeonName}</strong></span>
          </div>
        </div>
      </div>

      {/* Actionable Questionnaires Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* IPSS */}
        <Card className="hover:border-blue-500 transition-colors shadow-sm bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Activity className="h-6 w-6" />
              </div>
              {hasIpss && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                  ✓ Submitted
                </Badge>
              )}
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">1. Urinary Stream (IPSS)</h3>
              <p className="text-xs text-slate-500 mt-1">
                7 quick questions about stream quality, frequency, urgency, and nighttime waking.
              </p>
            </div>

            <Link href="/assessment/ipss" className="block">
              <Button size="sm" className="w-full gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                <span>{hasIpss ? 'Update IPSS Review' : 'Complete IPSS'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* SHIM */}
        <Card className="hover:border-purple-500 transition-colors shadow-sm bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Sparkles className="h-6 w-6" />
              </div>
              {hasShim && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                  ✓ Submitted
                </Badge>
              )}
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">2. Erectile Wellness (SHIM)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Confidential 5-question assessment to measure your nerve-sparing recovery progress.
              </p>
            </div>

            <Link href="/assessment/shim" className="block">
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs border-purple-300 text-purple-700 hover:bg-purple-50">
                <span>{hasShim ? 'Update SHIM Score' : 'Complete SHIM'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Continence */}
        <Card className="hover:border-blue-500 transition-colors shadow-sm bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Droplet className="h-6 w-6" />
              </div>
              {hasIncontinence && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                  ✓ Recorded
                </Badge>
              )}
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">3. 24h Pad Requirements</h3>
              <p className="text-xs text-slate-500 mt-1">
                Log your daytime and nighttime pad counts to guide pelvic floor rehabilitation.
              </p>
            </div>

            <Link href="/assessment/incontinence" className="block">
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                <span>{hasIncontinence ? 'Update Pad Count' : 'Log Continence'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Schedule Track for this specific patient */}
      <Card className="shadow-sm bg-white">
        <CardHeader className="p-5 pb-3 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Your Surgical Milestones ({patient.firstName}&apos;s Timeline)</span>
          </CardTitle>
          <Link href="/follow-up" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
            <span>View Full Schedule</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
            {['2m', '6m', '12m', '18m', '24m', '30m', '36m'].map((m, idx) => {
              const matchingMilestone = patient.followUps?.find((fu) => fu.milestone.toLowerCase().includes(m));
              const isDone = matchingMilestone?.status === 'completed' || idx === 0;

              return (
                <div
                  key={m}
                  className={`p-3 rounded-xl border ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-xs uppercase font-bold">{m} Review</div>
                  <div className="text-[10px] mt-1 text-slate-500">
                    {isDone ? '✓ Completed' : 'Pending Clinic'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
