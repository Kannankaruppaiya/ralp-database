'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export function OutcomeChart() {
  const surgeonComparisonData = [
    { surgeon: 'VK', caseload: 142, continenceRate: 94, potencyRate: 78, marginPositiveRate: 8.2 },
    { surgeon: 'RDM', caseload: 118, continenceRate: 91, potencyRate: 72, marginPositiveRate: 11.5 },
    { surgeon: 'CI', caseload: 96, continenceRate: 93, potencyRate: 81, marginPositiveRate: 9.0 },
    { surgeon: 'OAK', caseload: 84, continenceRate: 88, potencyRate: 65, marginPositiveRate: 13.1 },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
          Surgeon Benchmarking (VK, RDM, CI, OAK)
        </CardTitle>
        <p className="text-xs text-slate-500">
          1-Year Pad-Free Continence vs. Potency Recovery Rates (%)
        </p>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={surgeonComparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="surgeon" tickLine={false} tick={{ fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tickLine={false} unit="%" tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="continenceRate" name="Pad-Free Continence (%)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="potencyRate" name="Potency / SHIM Recovery (%)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="marginPositiveRate" name="Positive Margins (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function PSAChart() {
  return null;
}

export function IPSSChart() {
  return null;
}

export function SHIMChart() {
  return null;
}

export function ContinenceChart() {
  return null;
}

export function AnalyticsFilter() {
  return null;
}
