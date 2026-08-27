'use client';

import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export function PromTrends({ patient }: { patient: PatientFullRecord }) {
  // Aggregate data from baseline + follow-ups
  const chartData = [
    {
      milestone: 'Pre-Op',
      psa: patient.baseline?.psa || null,
      ipss: patient.proms.find((p) => p.milestone === 'baseline')?.ipssScore?.totalScore ?? null,
      shim: patient.proms.find((p) => p.milestone === 'baseline')?.shimScore?.totalScore ?? null,
      pads: 0,
    },
    ...patient.followUps
      .filter((f) => f.status === 'completed' || f.psa !== undefined || f.ipssScore !== undefined)
      .map((f) => ({
        milestone: f.milestone.toUpperCase(),
        psa: f.psa ?? null,
        ipss: f.ipssScore?.totalScore ?? null,
        shim: f.shimScore?.totalScore ?? null,
        pads:
          f.continence?.dayStatus === 'Completely dry, no pad'
            ? 0
            : f.continence?.dayStatus === 'Occasional leakage, no pad'
            ? 0.5
            : f.continence?.dayStatus === '1 pad/day'
            ? 1
            : f.continence?.dayStatus === '2 pads/day'
            ? 2
            : f.continence?.dayStatus === '>=3 pads/day'
            ? 3
            : 0,
      })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SHIM Potency Recovery Trajectory */}
        <Card className="shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              SHIM (IIEF-5) Erectile Function Trajectory (1-25)
            </CardTitle>
            <p className="text-xs text-slate-500">Longitudinal recovery of erectile function post-surgery</p>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="milestone" tickLine={false} tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
                  <YAxis domain={[0, 25]} tickLine={false} tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="shim"
                    name="SHIM Score (Max 25)"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#7c3aed' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* IPSS Urinary Recovery */}
        <Card className="shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              IPSS Urinary Symptom Trajectory (0-35)
            </CardTitle>
            <p className="text-xs text-slate-500">Lower score indicates better urinary stream and less bother</p>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="milestone" tickLine={false} tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
                  <YAxis domain={[0, 35]} tickLine={false} tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="ipss"
                    name="IPSS Score (Lower is better)"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0d9488' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Longitudinal PSA Surveillance Curve */}
      <Card className="shadow-sm border-cyan-100 dark:border-cyan-900/50">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-bold text-cyan-950 dark:text-cyan-200">
            Longitudinal Serum PSA Surveillance (ng/mL)
          </CardTitle>
          <p className="text-xs text-slate-500">Biochemical recurrence threshold: PSA ≥ 0.20 ng/mL</p>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="milestone" tickLine={false} tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="psa"
                  name="Serum PSA (ng/mL)"
                  stroke="#0284c7"
                  fill="#e0f2fe"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PromSummary({ patient }: { patient: PatientFullRecord }) {
  return <PromTrends patient={patient} />;
}
