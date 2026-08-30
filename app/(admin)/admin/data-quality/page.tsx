'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { usePatients } from '@/hooks/use-patients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react';
import { db } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export default function AdminDataQualityPage() {
  const { allPatients } = usePatients({ fetchAll: true });
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  const total = allPatients.length;
  const completeCount = allPatients.filter((p) => p.completeness.score >= 85).length;
  const missingBaselineCount = allPatients.filter((p) => !p.completeness.baselineComplete).length;
  const missingOperationCount = allPatients.filter((p) => !p.completeness.operationComplete).length;
  const missingHistologyCount = allPatients.filter((p) => !p.completeness.histologyComplete).length;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Registry Data Quality & Completeness"
          description="Automated validation metrics ensuring compliance with British Association of Urological Surgeons (BAUS) & NPCA standards"
          breadcrumbs={[
            { label: 'Admin Console', href: '/admin' },
            { label: 'Data Quality' },
          ]}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-600 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">NPCA Compliant</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {total > 0 ? Math.round((completeCount / total) * 100) : 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{completeCount} / {total} patients (&gt;85% data score)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missing Histology</span>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground dark:text-white">{missingHistologyCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Post-op pathology reports pending</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missing Baseline</span>
            <FileCheck2 className="h-4 w-4 text-warning-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground dark:text-white">{missingBaselineCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Pre-op PSA or biopsy grades</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600 shadow-sm">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missing Operation</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground dark:text-white">{missingOperationCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Surgical theatre logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit records by patient name, NHS, MRN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Filter className="h-3.5 w-3.5" />
            <span>Audit Filter:</span>
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 h-9 text-xs"
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
            className="w-28 h-9 text-xs"
          >
            <option value="15">15 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="max-h-[540px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm dark:bg-slate-900/95 shadow-sm">
              <TableRow className="border-b border-border dark:border-slate-800">
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
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    No patient records matching the selected audit criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/80 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-semibold text-xs text-foreground dark:text-slate-100 py-3">
                      <Link href={`/patients/${patient.id}`} className="hover:text-primary transition-colors font-bold">
                        {patient.firstName} {patient.surname}
                      </Link>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">NHS: {patient.nhsNumber} • MRN: {patient.hospitalNumber}</div>
                    </TableCell>

                    <TableCell className="text-xs font-mono font-bold text-primary dark:text-teal-400">
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
                        <div className="w-16 bg-muted rounded-full h-1.5 dark:bg-slate-800">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${patient.completeness.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground dark:text-slate-300">
                          {patient.completeness.score}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/patients/${patient.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
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

        {/* Industry Standard Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-muted/75 dark:bg-slate-900/75 border-t border-border dark:border-slate-800 text-xs text-muted-foreground">
          <div>
            <span>
              Showing <strong className="text-foreground dark:text-white">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-foreground dark:text-white">{Math.min(startIndex + pageSize, totalRecords)}</strong> of{' '}
              <strong className="text-foreground dark:text-white">{totalRecords.toLocaleString()}</strong> audit records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 text-xs font-mono font-medium text-foreground dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
