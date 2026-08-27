'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { OutcomeChart } from '@/components/analytics/outcome-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp, Award, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function AnalyticsHubPage() {
  const continenceRecoveryCurve = [
    { month: 'Baseline', dryPercent: 100 },
    { month: '2 Months', dryPercent: 48 },
    { month: '6 Months', dryPercent: 79 },
    { month: '12 Months', dryPercent: 93 },
    { month: '18 Months', dryPercent: 95 },
    { month: '24 Months', dryPercent: 96 },
  ];

  const potencyRecoveryCurve = [
    { month: 'Baseline', potentPercent: 95 },
    { month: '2 Months', potentPercent: 32 },
    { month: '6 Months', potentPercent: 58 },
    { month: '12 Months', potentPercent: 76 },
    { month: '18 Months', potentPercent: 82 },
    { month: '24 Months', potentPercent: 85 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surgical Outcomes & Benchmarking Analytics"
        description="Trifecta outcomes, recovery curves, and comparative metrics across surgeons VK, RDM, CI, and OAK"
        breadcrumbs={[{ label: 'Analytics' }]}
      />

      {/* Trifecta Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-teal-200 bg-teal-50/40 dark:border-teal-900 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">1-Year Trifecta Rate</span>
              <div className="text-2xl font-bold text-teal-950 dark:text-teal-100">74.8%</div>
              <span className="text-[11px] text-teal-700">Continence + Potency + BCR-free</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-200 bg-cyan-50/40 dark:border-cyan-900 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600 text-white">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">1-Year Pad-Free Rate</span>
              <div className="text-2xl font-bold text-cyan-950 dark:text-cyan-100">93.2%</div>
              <span className="text-[11px] text-cyan-700">0 pads / security liner only</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/40 dark:border-purple-900 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">Bilateral NS Potency (1yr)</span>
              <div className="text-2xl font-bold text-purple-950 dark:text-purple-100">81.4%</div>
              <span className="text-[11px] text-purple-700">SHIM ≥ 17 in potent baseline</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OutcomeChart />

        {/* Longitudinal Recovery Trajectory */}
        <Card className="shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Cohort Functional Recovery Curves (0 - 24 Months)
            </CardTitle>
            <p className="text-xs text-slate-500">Pad-free continence vs. bilateral nerve-sparing erectile recovery</p>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={continenceRecoveryCurve}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="dryPercent"
                    name="Continence Pad-Free Rate (%)"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0d9488' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
