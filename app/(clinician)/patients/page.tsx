'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { usePatients } from '@/hooks/use-patients';
import { formatNhsNumber, formatDate, formatPsa, getRiskCategory } from '@/lib/formatters';
import { SURGEON_OPTIONS, CLINICAL_STAGE_OPTIONS } from '@/config/clinical-options';
import { SurgeonCode } from '@/types/common';
import { Plus, Search, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, UserCheck } from 'lucide-react';
import { useSession } from '@/lib/auth';

export default function PatientsRegistryPage() {
  const { user: currentUser } = useSession();
  const [search, setSearch] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState<SurgeonCode | 'ALL'>(
    (currentUser?.role === 'Consultant Surgeon' && currentUser.surgeonCode) ? currentUser.surgeonCode : 'ALL'
  );
  const [stageFilter, setStageFilter] = useState<string | 'ALL'>('ALL');
  const [pageSize, setPageSize] = useState(25);

  const { patients, filteredCount, isLoading, page, totalPages, setPage } = usePatients({
    searchQuery: search,
    surgeon: surgeonFilter,
    stage: stageFilter,
    pageSize,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Patients Registry"
        description="Comprehensive directory of RALP patients, oncological profiles, and longitudinal tracking"
        breadcrumbs={[{ label: 'Patients Registry' }]}
        action={
          <Link href="/patients/new">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Register New Patient</span>
            </Button>
          </Link>
        }
      />

      {/* Industry Standard Filter & Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, NHS number, MRN… (min. 2 characters)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <Select
            value={surgeonFilter}
            onChange={(e) => setSurgeonFilter(e.target.value as any)}
            className="w-36 h-9 text-xs"
          >
            <option value="ALL">All Surgeons</option>
            {SURGEON_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                Surgeon {s.value}
              </option>
            ))}
          </Select>

          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="ALL">All Stages</option>
            {CLINICAL_STAGE_OPTIONS.map((st) => (
              <option key={st.value} value={st.value}>
                Stage {st.value}
              </option>
            ))}
          </Select>

          <Select
            value={pageSize.toString()}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-28 h-9 text-xs"
          >
            <option value="15">15 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>
        </div>
      </div>

      {/* Contained Viewport Table with Sticky Header */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="max-h-[580px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm dark:bg-slate-900/95 shadow-sm">
              <TableRow className="border-b border-slate-200 dark:border-slate-800">
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
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-500">
                    {isLoading
                      ? 'Loading patients…'
                      : search.length > 0 && search.length < 2
                      ? 'Type at least 2 characters to search.'
                      : 'No patients found matching the current search & filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => {
                  return (
                    <TableRow key={patient.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100 py-3">
                        <Link href={`/patients/${patient.id}`} className="hover:text-teal-600 text-sm font-bold block transition-colors">
                          {patient.firstName} {patient.surname}
                        </Link>
                        <div className="text-xs text-slate-400 font-normal mt-0.5 space-x-2 font-mono">
                          <span>NHS: {formatNhsNumber(patient.nhsNumber)}</span>
                          <span>•</span>
                          <span>MRN: {patient.hospitalNumber}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-bold text-xs">
                          {patient.primarySurgeon}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-mono">
                        {patient.baseline ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{formatPsa(patient.baseline.psa)}</span>
                            <span className="block text-slate-500 text-[11px]">
                              {patient.baseline.gleasonGrade} (cStage {patient.baseline.clinicalStage})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs">
                        {patient.operation ? (
                          <div>
                            <span className="font-semibold font-mono">{formatDate(patient.operation.operationDate)}</span>
                            <span className="block text-slate-500 text-[11px]">
                              NS: {patient.operation.nerveSparing}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not logged</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs">
                        {patient.histology ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              pT{patient.histology.pathologicalStage}
                            </span>
                            <span className="block text-slate-500 text-[11px]">
                              {patient.histology.gleasonGrade} ({patient.histology.surgicalMargins?.includes('Positive') ? 'R1' : 'R0'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Awaiting lab</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full"
                              style={{ width: `${patient.completeness.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {patient.completeness.score}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                            <span>View Record</span>
                            <ArrowRight className="h-3.5 w-3.5" />
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

        {/* Industry Standard Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50/75 dark:bg-slate-900/75 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div>
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredCount === 0 ? 0 : ((page - 1) * pageSize) + 1}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white">{Math.min(page * pageSize, filteredCount)}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{filteredCount.toLocaleString()}</strong> patients
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
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

