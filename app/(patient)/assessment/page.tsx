'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Sparkles, Droplet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCurrentPatient } from '@/lib/auth';
import { PatientFullRecord } from '@/types/patient';

export default function AssessmentHubPage() {
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

  const completedProms = patient.proms || [];
  const hasIpss = completedProms.some((p) => Boolean(p.ipssScore || p.ipssAnswers));
  const hasShim = completedProms.some((p) => Boolean(p.shimScore || p.shimAnswers));
  const hasIncontinence = completedProms.some((p) => Boolean(p.continence));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post-Operative Outcome Questionnaires</h1>
          <p className="text-xs text-slate-500 mt-1">
            Questionnaires for <strong>{patient.firstName} {patient.surname}</strong> (Surgeon: {patient.primarySurgeon}).
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          NHS: {patient.nhsNumber}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* IPSS Card */}
        <Card className="shadow-sm hover:border-teal-500 transition-colors bg-white">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 flex-shrink-0">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">International Prostate Symptom Score (IPSS)</h3>
                  <Badge variant="info">Urinary Stream</Badge>
                  {hasIpss && (
                    <Badge variant="success" className="text-[10px]">
                      ✓ Completed
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  7 symptom questions (0-35) + 1 Quality of Life satisfaction question. Takes ~2 minutes.
                </p>
              </div>
            </div>
            <Link href="/assessment/ipss">
              <Button className="gap-1.5 text-xs shadow-sm bg-teal-600 hover:bg-teal-700 text-white">
                <span>{hasIpss ? 'Update IPSS' : 'Start IPSS'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* SHIM Card */}
        <Card className="shadow-sm hover:border-purple-500 transition-colors bg-white">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 flex-shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">Sexual Health Inventory for Men (SHIM / IIEF-5)</h3>
                  <Badge variant="purple">Potency</Badge>
                  {hasShim && (
                    <Badge variant="success" className="text-[10px]">
                      ✓ Completed
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  5 confidential questions (1-25) to track erectile function recovery after nerve-sparing surgery.
                </p>
              </div>
            </div>
            <Link href="/assessment/shim">
              <Button variant="outline" className="gap-1.5 text-xs border-purple-300 text-purple-700 hover:bg-purple-50">
                <span>{hasShim ? 'Update SHIM' : 'Start SHIM'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Incontinence Card */}
        <Card className="shadow-sm hover:border-blue-500 transition-colors bg-white">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 flex-shrink-0">
                <Droplet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">24-Hour Pad Usage & Continence Log</h3>
                  <Badge variant="outline">Continence</Badge>
                  {hasIncontinence && (
                    <Badge variant="success" className="text-[10px]">
                      ✓ Recorded
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Daytime pad count, nighttime waking, and leakage frequency recording.
                </p>
              </div>
            </div>
            <Link href="/assessment/incontinence">
              <Button variant="outline" className="gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                <span>{hasIncontinence ? 'Update Log' : 'Log Continence'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
