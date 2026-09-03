'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { usePatients } from '@/hooks/use-patients';
import { formatNhsNumber, formatDate, formatPsa, getRiskCategory } from '@/lib/formatters';
import { CLINICAL_STAGE_OPTIONS } from '@/config/clinical-options';
import { useSurgeons } from '@/hooks/use-surgeons';
import { SurgeonCode } from '@/types/common';
import {
  Plus,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Users,
} from 'lucide-react';
import { useSession } from '@/lib/auth';

export default function PatientsRegistryPage() {
  const { user: currentUser, isLoading: sessionLoading } = useSession();
  const { surgeons } = useSurgeons();
  const [search, setSearch] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState<SurgeonCode | 'ALL' | null>(null);
  const [stageFilter, setStageFilter] = useState<string | 'ALL'>('ALL');
  const [pageSize, setPageSize] = useState(25);

  const effectiveSurgeonFilter: SurgeonCode | 'ALL' =
    surgeonFilter !== null
      ? surgeonFilter
      : currentUser?.role === 'Consultant Surgeon' && currentUser.surgeonCode
      ? currentUser.surgeonCode
      : 'ALL';

  const { patients, filteredCount, isLoading: isPatientsLoading, page, totalPages, setPage } = usePatients({
    searchQuery: search,
    surgeon: effectiveSurgeonFilter,
    stage: stageFilter,
    pageSize,
    enabled: !sessionLoading,
  });

  const isLoading = sessionLoading || isPatientsLoading;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Patients Registry"
        description="Comprehensive master directory of RALP prostatectomy patients, oncological profiles, and longitudinal tracking"
        breadcrumbs={[{ label: 'Patients Registry' }]}
        action={
          <Link href="/patients/new">
            <Button size="sm" className="gap-1.5 shadow-sm font-semibold">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Register New Patient</span>
            </Button>
          </Link>
        }
      />

      {/* Filter & Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <Input
            type="search"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search patients by name, NHS number, or MRN"
            placeholder="Search by name, NHS number, MRN… (min. 2 characters)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 whitespace-nowrap">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Filters:</span>
          </div>

          <div className="w-36">
            <Select
              aria-label="Filter by surgeon"
              value={effectiveSurgeonFilter}
              onChange={(e) => setSurgeonFilter(e.target.value as any)}
              className="h-9 text-xs"
            >
              <option value="ALL">All Surgeons</option>
              {surgeons.map((s) => (
                <option key={s.value} value={s.value}>
                  Surgeon {s.value}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-36">
            <Select
              aria-label="Filter by clinical stage"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="ALL">All Stages</option>
              {CLINICAL_STAGE_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  Stage {st.value}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-28">
            <Select
              aria-label="Select page size"
              value={pageSize.toString()}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 text-xs"
            >
              <option value="15">15 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Contained Viewport Table with Sticky Header */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-[#272727] dark:bg-[#181818]">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm dark:bg-[#181818]/95 shadow-sm">
              <TableRow className="border-b border-slate-200 dark:border-[#272727]">
                <TableHead>Patient Details</TableHead>
                <TableHead>Surgeon</TableHead>
                <TableHead>Pre-Op Baseline</TableHead>
                <TableHead>Operation (RALP)</TableHead>
                <TableHead>Histology (pTNM)</TableHead>
                <TableHead>Completeness</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    {isLoading ? (
                      <div className="text-sm text-slate-500">Loading patients…</div>
                    ) : (
                      <EmptyState
                        icon={Users}
                        title="No matching patients found"
                        description={
                          search.length > 0 && search.length < 2
                            ? 'Please type at least 2 characters to search.'
                            : 'No clinical records match your search query and filter criteria.'
                        }
                        actionLabel={search ? 'Clear Search' : 'Register New Patient'}
                        onAction={search ? () => setSearch('') : undefined}
                        actionHref={!search ? '/patients/new' : undefined}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => {
                  const risk = getRiskCategory(
                    patient.baseline?.psa,
                    patient.baseline?.gleasonGrade,
                    patient.baseline?.clinicalStage
                  );

                  return (
                    <TableRow key={patient.id} className="hover:bg-slate-50/90 dark:hover:bg-[#1F1F1F]/60 transition-colors duration-200 group">
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold text-xs border border-teal-200/60 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800/60 group-hover:scale-105 transition-transform duration-200">
                            {patient.firstName[0]}{patient.surname[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={`/patients/${patient.id}`} className="hover:text-teal-600 dark:hover:text-teal-400 text-sm font-bold block transition-colors">
                                {patient.firstName} {patient.surname}
                              </Link>
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 font-semibold ${risk.color}`}>
                                {risk.category}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5 space-x-2 font-mono [font-variant-numeric:tabular-nums]">
                              <span>NHS: {formatNhsNumber(patient.nhsNumber)}</span>
                              <span>•</span>
                              <span>MRN: {patient.hospitalNumber}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-xs bg-slate-50 dark:bg-[#1F1F1F] border-slate-200 dark:border-[#272727] text-slate-700 dark:text-slate-300">
                          {patient.primarySurgeon}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs [font-variant-numeric:tabular-nums]">
                        {patient.baseline ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{formatPsa(patient.baseline.psa)}</span>
                            <span className="block text-slate-500 dark:text-slate-400 text-[11px]">
                              {patient.baseline.gleasonGrade} (cStage {patient.baseline.clinicalStage})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs [font-variant-numeric:tabular-nums]">
                        {patient.operation ? (
                          <div>
                            <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{formatDate(patient.operation.operationDate)}</span>
                            <span className="block text-slate-500 dark:text-slate-400 text-[11px]">
                              NS: <strong className="text-teal-700 dark:text-teal-400">{patient.operation.nerveSparing}</strong>
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not logged</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs [font-variant-numeric:tabular-nums]">
                        {patient.histology ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              pT{patient.histology.pathologicalStage}
                            </span>
                            <span className="block text-slate-500 dark:text-slate-400 text-[11px]">
                              {patient.histology.gleasonGrade} (
                              <span className={patient.histology.surgicalMargins?.includes('Positive') ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                                {patient.histology.surgicalMargins?.includes('Positive') ? 'R1' : 'R0'}
                              </span>
                              )
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Awaiting lab</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-[#272727] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${patient.completeness.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 [font-variant-numeric:tabular-nums]">
                            {patient.completeness.score}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-[#1F1F1F]">
                            <span>View Record</span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50/80 dark:bg-[#121212]/80 border-t border-slate-200 dark:border-[#272727] text-xs text-slate-500">
          <div>
            <span>
              Showing <strong className="text-slate-900 dark:text-white [font-variant-numeric:tabular-nums]">{filteredCount === 0 ? 0 : ((page - 1) * pageSize) + 1}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white [font-variant-numeric:tabular-nums]">{Math.min(page * pageSize, filteredCount)}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white [font-variant-numeric:tabular-nums]">{filteredCount.toLocaleString()}</strong> patients
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              aria-label="Go to first page"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Go to previous page"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>

            <span className="px-2 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 [font-variant-numeric:tabular-nums]">
              Page {page} of {totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Go to next page"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Go to last page"
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
