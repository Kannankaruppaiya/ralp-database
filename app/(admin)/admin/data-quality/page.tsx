'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { usePatients } from '@/hooks/use-patients';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { CompletenessCard } from '@/components/data-quality/completeness-card';
import { ConflictSummary, ClinicalConflict } from '@/components/data-quality/conflict-summary';
import { MissingDataList, MissingDataItem } from '@/components/data-quality/missing-data-list';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react';

export default function AdminDataQualityPage() {
  const { allPatients } = usePatients({ fetchAll: true });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  const total = allPatients.length;
  const completeCount = allPatients.filter((p) => p.completeness.score >= 85).length;
  const missingBaselineCount = allPatients.filter((p) => !p.completeness.baselineComplete).length;
  const missingOperationCount = allPatients.filter((p) => !p.completeness.operationComplete).length;
  const missingHistologyCount = allPatients.filter((p) => !p.completeness.histologyComplete).length;

  const averageScore = total > 0
    ? Math.round(allPatients.reduce((sum, p) => sum + p.completeness.score, 0) / total)
    : 0;

  const baselineRate = total > 0
    ? Math.round((allPatients.filter((p) => p.completeness.baselineComplete).length / total) * 100)
    : 0;

  const operationRate = total > 0
    ? Math.round((allPatients.filter((p) => p.completeness.operationComplete).length / total) * 100)
    : 0;

  const histologyRate = total > 0
    ? Math.round((allPatients.filter((p) => p.completeness.histologyComplete).length / total) * 100)
    : 0;

  const promsRate = total > 0
    ? Math.round((allPatients.filter((p) => p.completeness.followUpsComplete >= 1).length / total) * 100)
    : 0;

  // Extract missing data items
  const missingDataItems: MissingDataItem[] = useMemo(() => {
    const items: MissingDataItem[] = [];
    allPatients.forEach((p) => {
      if (!p.completeness.histologyComplete) {
        items.push({
          id: `${p.id}-hist`,
          patientId: p.id,
          patientName: `${p.firstName} ${p.surname}`,
          hospitalNumber: p.hospitalNumber,
          surgeon: p.primarySurgeon,
          missingField: 'Post-op Histology (pTNM / Margins)',
          daysPending: 14,
          stage: 'Histology',
        });
      }
      if (!p.completeness.baselineComplete) {
        items.push({
          id: `${p.id}-base`,
          patientId: p.id,
          patientName: `${p.firstName} ${p.surname}`,
          hospitalNumber: p.hospitalNumber,
          surgeon: p.primarySurgeon,
          missingField: 'Pre-op Baseline PSA / Biopsy Grade',
          daysPending: 28,
          stage: 'Baseline',
        });
      }
      if (!p.completeness.operationComplete) {
        items.push({
          id: `${p.id}-op`,
          patientId: p.id,
          patientName: `${p.firstName} ${p.surname}`,
          hospitalNumber: p.hospitalNumber,
          surgeon: p.primarySurgeon,
          missingField: 'Surgical Theatre Operative Log',
          daysPending: 7,
          stage: 'Operation',
        });
      }
    });
    return items.slice(0, 10);
  }, [allPatients]);

  // Extract mock conflicts from data validation logic
  const conflicts: ClinicalConflict[] = useMemo(() => {
    const list: ClinicalConflict[] = [];
    allPatients.forEach((p) => {
      if (p.completeness.histologyComplete && !p.completeness.operationComplete) {
        list.push({
          id: `${p.id}-conflict`,
          patientId: p.id,
          patientName: `${p.firstName} ${p.surname}`,
          hospitalNumber: p.hospitalNumber,
          surgeon: p.primarySurgeon,
          type: 'UNLINKED_PATHOLOGY',
          title: 'Histology Logged Without Theatre Record',
          description: 'A pathology specimen report was filed, but the matching operative log is missing.',
          severity: 'high',
        });
      }
    });
    return list;
  }, [allPatients]);

  const filteredPatients = useMemo(() => {
    return allPatients.filter((p) => {
      if (statusFilter === 'INCOMPLETE' && p.completeness.score >= 85) return false;
      if (statusFilter === 'MISSING_HISTOLOGY' && p.completeness.histologyComplete) return false;
      if (statusFilter === 'MISSING_BASELINE' && p.completeness.baselineComplete) return false;

      if (search.trim().length >= 2) {
        const q = search.toLowerCase();
        const nameMatch = `${p.firstName} ${p.surname}`.toLowerCase().includes(q);
        const nhsMatch = p.nhsNumber.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const mrnMatch = p.hospitalNumber.toLowerCase().includes(q);
        if (!nameMatch && !nhsMatch && !mrnMatch) return false;
      }
      return true;
    });
  }, [allPatients, search, statusFilter]);

  const totalRecords = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registry Data Quality & Completeness"
        description="Automated validation metrics ensuring compliance with British Association of Urological Surgeons (BAUS) & NPCA standards"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'Data Quality' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-600 shadow-sm border-slate-200 dark:border-[#272727] dark:border-l-teal-500 bg-white dark:bg-[#181818]">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NPCA Compliant</span>
            <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
              {total > 0 ? Math.round((completeCount / total) * 100) : 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1 [font-variant-numeric:tabular-nums]">{completeCount} / {total} patients (&gt;85% data score)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm border-slate-200 dark:border-[#272727] dark:border-l-rose-500 bg-white dark:bg-[#181818]">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Histology</span>
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">{missingHistologyCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Post-op pathology reports pending</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm border-slate-200 dark:border-[#272727] dark:border-l-amber-500 bg-white dark:bg-[#181818]">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Baseline</span>
            <FileCheck2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">{missingBaselineCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Pre-op PSA or biopsy grades</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600 shadow-sm border-slate-200 dark:border-[#272727] dark:border-l-indigo-500 bg-white dark:bg-[#181818]">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Operation</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">{missingOperationCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Surgical theatre logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="registry" className="space-y-6">
        <TabsList className="bg-[#181818] border border-[#272727]">
          <TabsTrigger value="registry">Patient Audit Registry</TabsTrigger>
          <TabsTrigger value="analytics">Completeness Analytics</TabsTrigger>
          <TabsTrigger value="missing">Missing Data Queue ({missingDataItems.length})</TabsTrigger>
          <TabsTrigger value="conflicts">Validation Conflicts ({conflicts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search audit records by patient name, NHS, MRN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap font-medium">
                <Filter className="h-3.5 w-3.5" />
                <span>Audit Filter:</span>
              </div>

              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-48 h-9 text-xs rounded-xl"
              >
                <option value="ALL">All Records ({total.toLocaleString()})</option>
                <option value="INCOMPLETE">Incomplete Only (&lt;85%)</option>
                <option value="MISSING_HISTOLOGY">Missing Histology Report</option>
                <option value="MISSING_BASELINE">Missing Baseline Pre-op PSA</option>
              </Select>

              <Select
                value={pageSize.toString()}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="w-28 h-9 text-xs rounded-xl font-mono"
              >
                <option value="15">15 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </Select>
            </div>
          </div>

          {/* Table Container with Sticky Header */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-[#272727] dark:bg-[#181818]">
            <div className="max-h-[540px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm dark:bg-[#121212]/90 shadow-sm">
                  <TableRow className="border-b border-slate-200 dark:border-[#272727]">
                    <TableHead>Patient Details</TableHead>
                    <TableHead>Surgeon</TableHead>
                    <TableHead>Pre-Op Baseline</TableHead>
                    <TableHead>Operation Log</TableHead>
                    <TableHead>Histology (pTNM)</TableHead>
                    <TableHead>Completeness</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-500">
                        No patient records matching the selected audit criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPatients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1F1F1F]/60 transition-colors duration-200 border-b border-slate-100 dark:border-[#272727]">
                        <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100 py-3">
                          <Link href={`/patients/${patient.id}`} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-bold">
                            {patient.firstName} {patient.surname}
                          </Link>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 [font-variant-numeric:tabular-nums]">NHS: {patient.nhsNumber} • MRN: {patient.hospitalNumber}</div>
                        </TableCell>

                        <TableCell className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                          {patient.primarySurgeon}
                        </TableCell>

                        <TableCell>
                          <Badge variant={patient.completeness.baselineComplete ? 'success' : 'destructive'} className="text-[10px]">
                            {patient.completeness.baselineComplete ? 'Complete' : 'Missing'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant={patient.completeness.operationComplete ? 'success' : 'destructive'} className="text-[10px]">
                            {patient.completeness.operationComplete ? 'Complete' : 'Missing'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant={patient.completeness.histologyComplete ? 'success' : 'destructive'} className="text-[10px]">
                            {patient.completeness.histologyComplete ? 'Complete' : 'Missing'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 dark:bg-[#1F1F1F]">
                              <div
                                className="bg-teal-600 h-1.5 rounded-full"
                                style={{ width: `${patient.completeness.score}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 [font-variant-numeric:tabular-nums]">
                              {patient.completeness.score}%
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 font-semibold">
                              <span>View Record</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50/75 dark:bg-[#181818] border-t border-slate-200 dark:border-[#272727] text-xs text-slate-500 [font-variant-numeric:tabular-nums]">
              <div>
                <span>
                  Showing <strong className="text-slate-900 dark:text-white">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-900 dark:text-white">{Math.min(startIndex + pageSize, totalRecords)}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{totalRecords.toLocaleString()}</strong> audit records
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(1)}
                  aria-label="Go to first page"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <span className="px-2 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Go to next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(totalPages)}
                  aria-label="Go to last page"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <CompletenessCard
            metrics={{
              totalPatients: total,
              averageScore,
              baselineRate,
              operationRate,
              histologyRate,
              promsRate,
            }}
          />
        </TabsContent>

        <TabsContent value="missing">
          <MissingDataList items={missingDataItems} />
        </TabsContent>

        <TabsContent value="conflicts">
          <ConflictSummary conflicts={conflicts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
