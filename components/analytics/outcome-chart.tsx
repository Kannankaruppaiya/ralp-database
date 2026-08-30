'use client';

import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOutcomes } from '@/hooks/use-outcomes';

/**
 * Surgeon benchmarking, computed by the database from completed 12-month
 * assessments. A surgeon with no completed assessments shows no bar rather than
 * a zero, so an empty denominator is never read as a poor result.
 */
export function OutcomeChart() {
  const { benchmark, isLoading, error } = useOutcomes();

  const data = benchmark.map((b) => ({
    surgeon: b.surgeon,
    caseload: b.caseload,
    continenceRate: b.continenceRate,
    potencyRate: b.potencyRate,
    marginPositiveRate: b.marginPositiveRate,
    n: b.continenceN,
  }));

  const noAssessments = data.every((d) => d.continenceRate === null && d.potencyRate === null);

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
          Surgeon Benchmarking
        </CardTitle>
        <p className="text-xs text-slate-500">
          12-month pad-free continence and potency (SHIM ≥ 17), with positive-margin rate
        </p>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {error ? (
          <div className="flex h-72 items-center justify-center text-xs text-rose-600">{error}</div>
        ) : isLoading ? (
          <div className="h-72 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : noAssessments ? (
          <div className="flex h-72 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No completed 12-month assessments yet
            </p>
            <p className="text-xs text-slate-500 max-w-xs">
              Benchmarking appears once patients reach their 1-year milestone and return their
              questionnaires.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="surgeon"
                  tickLine={false}
                  tick={{ fontSize: 12, fontFamily: 'Hanken Grotesk, sans-serif', fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  unit="%"
                  tick={{ fontSize: 11, fontFamily: 'Hanken Grotesk, sans-serif', fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}
                  formatter={(v, name) =>
                    (v === null || v === undefined ? ['no data', String(name)] : [`${v}%`, String(name)]) as [string, string]
                  }
                  labelFormatter={(s: string) => {
                    const row = data.find((d) => d.surgeon === s);
                    return `Surgeon ${s} — ${row?.caseload ?? 0} cases, n=${row?.n ?? 0} assessed`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="continenceRate" name="Pad-free continence" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="potencyRate" name="Potency (SHIM ≥ 17)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="marginPositiveRate" name="Positive margins" fill="#e11d48" radius={[4, 4, 0, 0]}>
                  {data.map((d) => (
                    <Cell key={d.surgeon} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
