'use client';

import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RecoveryPoint } from '@/types/outcomes';

/**
 * Functional recovery across the 7 milestones, from completed assessments only.
 *
 * Milestones with no returned questionnaires are dropped rather than plotted at
 * zero — an unanswered milestone is missing data, not a poor outcome, and a line
 * that dives to zero at 36 months because one patient has got that far would be
 * read as a collapse in results.
 */
export function RecoveryCurve({ curve }: { curve: RecoveryPoint[] }) {
  const data = curve
    .filter((p) => p.continenceN > 0 || p.potencyN > 0)
    .map((p) => ({
      label: `${p.months}m`,
      continent: p.continentPct,
      potent: p.potentPct,
      n: Math.max(p.continenceN, p.potencyN),
    }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-sm font-bold text-foreground dark:text-white">
          Functional Recovery Curve
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pad-free continence and potency (SHIM ≥ 17) by milestone, completed assessments only
        </p>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {data.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-semibold text-foreground dark:text-slate-300">
              No completed assessments yet
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              The curve builds as patients return their milestone questionnaires.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} unit="%" tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: 12, borderRadius: 12, border: '1px solid hsl(var(--border))' }}
                  formatter={(v, name) =>
                    (v === null || v === undefined ? ['no data', String(name)] : [`${v}%`, String(name)]) as [string, string]
                  }
                  labelFormatter={(l: string) => {
                    const row = data.find((d) => d.label === l);
                    return `${l} — n=${row?.n ?? 0} assessed`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone" dataKey="continent" name="Pad-free continence"
                  stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} connectNulls
                />
                <Line
                  type="monotone" dataKey="potent" name="Potency (SHIM ≥ 17)"
                  stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 3 }} connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
