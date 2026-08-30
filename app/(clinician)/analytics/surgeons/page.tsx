'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { OutcomeChart } from '@/components/analytics/outcome-chart';
import { useOutcomes } from '@/hooks/use-outcomes';
import { SURGEON_OPTIONS } from '@/config/clinical-options';

const pct = (v: number | null) => (v === null ? '—' : `${v}%`);
const fullName = (code: string) =>
  SURGEON_OPTIONS.find((s) => s.value === code)?.fullName ?? code;

export default function SurgeonsAnalyticsPage() {
  const { benchmark, isLoading, error } = useOutcomes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surgeon Benchmarking"
        description="Caseload, 12-month functional recovery and margin status by operating surgeon"
        breadcrumbs={[{ label: 'Analytics', href: '/analytics' }, { label: 'Surgeons' }]}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{error}</div>
      )}

      <OutcomeChart />

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Surgeon</TableHead>
                <TableHead>Caseload</TableHead>
                <TableHead>Continence (12m)</TableHead>
                <TableHead>Potency (12m)</TableHead>
                <TableHead>Positive margins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    Loading benchmarks…
                  </TableCell>
                </TableRow>
              ) : benchmark.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No operations recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                benchmark.map((b) => (
                  <TableRow key={b.surgeon}>
                    <TableCell>
                      <div className="font-semibold">{b.surgeon}</div>
                      <div className="text-[11px] text-muted-foreground">{fullName(b.surgeon)}</div>
                    </TableCell>
                    <TableCell className="font-semibold">{b.caseload}</TableCell>
                    <TableCell>
                      {pct(b.continenceRate)}
                      <span className="ml-1 text-[11px] text-muted-foreground">n={b.continenceN}</span>
                    </TableCell>
                    <TableCell>
                      {pct(b.potencyRate)}
                      <span className="ml-1 text-[11px] text-muted-foreground">n={b.potencyN}</span>
                    </TableCell>
                    <TableCell>
                      {b.marginPositiveRate === null ? (
                        '—'
                      ) : (
                        <Badge variant={b.marginPositiveRate > 20 ? 'destructive' : 'success'}>
                          {b.marginPositiveRate}%
                        </Badge>
                      )}
                      <span className="ml-1 text-[11px] text-muted-foreground">n={b.histologyN}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Case mix is not adjusted for. A surgeon operating on higher-risk disease will show a higher
        positive-margin rate and slower functional recovery, so these figures compare activity, not
        skill, and should not be read as a ranking.
      </p>
    </div>
  );
}
