'use client';

import React, { useState, useMemo } from 'react';
import { EnrichedFollowUp } from '@/hooks/use-follow-ups';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDate, formatPsa } from '@/lib/formatters';
import { getDaysRemaining } from '@/lib/date';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Send,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSurgeons } from '@/hooks/use-surgeons';

type SortField = 'patient' | 'dueDate' | 'milestone' | 'surgeon' | 'psa' | 'status';
type SortOrder = 'asc' | 'desc';

export function FollowUpTable({ followUps }: { followUps: EnrichedFollowUp[] }) {
  const { toast } = useToast();
  const { surgeons } = useSurgeons();
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);
  
  // Table Controls State
  const [search, setSearch] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState('ALL');
  const [milestoneFilter, setMilestoneFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filter & Search
  const filteredList = useMemo(() => {
    return followUps.filter((fu) => {
      if (surgeonFilter !== 'ALL' && fu.patient.primarySurgeon !== surgeonFilter) return false;
      if (milestoneFilter !== 'ALL' && fu.milestone.toLowerCase() !== milestoneFilter.toLowerCase()) return false;

      if (search.trim().length >= 2) {
        const q = search.toLowerCase();
        const nameMatch = `${fu.patient.firstName} ${fu.patient.surname}`.toLowerCase().includes(q);
        const nhsMatch = fu.patient.nhsNumber.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const hospMatch = fu.patient.hospitalNumber.toLowerCase().includes(q);
        if (!nameMatch && !nhsMatch && !hospMatch) return false;
      }
      return true;
    });
  }, [followUps, search, surgeonFilter, milestoneFilter]);

  // Sorting
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'dueDate') {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortField === 'patient') {
        comparison = `${a.patient.surname} ${a.patient.firstName}`.localeCompare(`${b.patient.surname} ${b.patient.firstName}`);
      } else if (sortField === 'milestone') {
        comparison = a.targetMonths - b.targetMonths;
      } else if (sortField === 'surgeon') {
        comparison = a.patient.primarySurgeon.localeCompare(b.patient.primarySurgeon);
      } else if (sortField === 'psa') {
        comparison = (a.psa ?? -1) - (b.psa ?? -1);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredList, sortField, sortOrder]);

  // Pagination
  const totalRecords = sortedList.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = sortedList.slice(startIndex, startIndex + pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleRequestResponse = (fu: EnrichedFollowUp) => {
    setDispatchedIds((prev) => [...prev, fu.id]);
    toast({
      title: 'Digital PROM Link Dispatched',
      description: `Sent ${fu.milestone.toUpperCase()} questionnaire invite to ${fu.patient.firstName} ${fu.patient.surname} via NHS Notify.`,
      variant: 'default',
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-teal-700 dark:text-teal-400 shrink-0" />
    ) : (
      <ArrowDown className="h-3 w-3 text-teal-700 dark:text-teal-400 shrink-0" />
    );
  };

  return (
    <div className="space-y-3">
      {/* Enterprise Search & Filter Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 p-2.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <Input
            placeholder="Search by patient name, NHS number, MRN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 text-xs bg-slate-50/50 border-slate-200/80 focus:bg-white dark:bg-slate-950 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <Filter className="h-3 w-3" aria-hidden="true" />
            <span>Filters:</span>
          </div>

          <Select
            value={surgeonFilter}
            onChange={(e) => {
              setSurgeonFilter(e.target.value);
              setPage(1);
            }}
            className="w-32 h-8 text-xs bg-white dark:bg-slate-900"
          >
            <option value="ALL">All Surgeons</option>
            {surgeons.map((s) => (
              <option key={s.value} value={s.value}>
                Surgeon {s.value}
              </option>
            ))}
          </Select>

          <Select
            value={milestoneFilter}
            onChange={(e) => {
              setMilestoneFilter(e.target.value);
              setPage(1);
            }}
            className="w-32 h-8 text-xs bg-white dark:bg-slate-900"
          >
            <option value="ALL">All Milestones</option>
            <option value="6w">6 Weeks (6W)</option>
            <option value="2m">2 Months (2M)</option>
            <option value="6m">6 Months (6M)</option>
            <option value="12m">12 Months (12M)</option>
            <option value="18m">18 Months (18M)</option>
            <option value="24m">24 Months (24M)</option>
            <option value="36m">36 Months (36M)</option>
          </Select>

          <Select
            value={pageSize.toString()}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="w-24 h-8 text-xs bg-white dark:bg-slate-900"
          >
            <option value="10">10 / page</option>
            <option value="15">15 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>
        </div>
      </div>

      {/* High-Precision Follow-ups Data Grid */}
      <div className="rounded-lg border border-slate-200/90 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none hover:text-teal-700 dark:hover:text-teal-400 transition-colors py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  onClick={() => toggleSort('patient')}
                >
                  <div className="flex items-center gap-1">
                    <span>Patient</span>
                    {getSortIcon('patient')}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none hover:text-teal-700 dark:hover:text-teal-400 transition-colors py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  onClick={() => toggleSort('milestone')}
                >
                  <div className="flex items-center gap-1">
                    <span>Milestone</span>
                    {getSortIcon('milestone')}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none hover:text-teal-700 dark:hover:text-teal-400 transition-colors py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  onClick={() => toggleSort('surgeon')}
                >
                  <div className="flex items-center gap-1">
                    <span>Surgeon</span>
                    {getSortIcon('surgeon')}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none hover:text-teal-700 dark:hover:text-teal-400 transition-colors py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  onClick={() => toggleSort('dueDate')}
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    {getSortIcon('dueDate')}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none hover:text-teal-700 dark:hover:text-teal-400 transition-colors py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  onClick={() => toggleSort('psa')}
                >
                  <div className="flex items-center gap-1">
                    <span>PSA Status</span>
                    {getSortIcon('psa')}
                  </div>
                </TableHead>

                <TableHead className="py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  PROM Checklist
                </TableHead>

                <TableHead
                  className="cursor-pointer select-none hover:text-teal-700 dark:hover:text-teal-400 transition-colors py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </TableHead>

                <TableHead className="text-right py-2 px-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-slate-500">
                    No follow-up records found matching the active filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedList.map((fu) => {
                  const { isOverdue, label: dueLabel } = getDaysRemaining(fu.dueDate);
                  const isDispatched = dispatchedIds.includes(fu.id);
                  const hasPsa = fu.psa !== undefined;
                  const hasIpss = fu.ipssScore?.totalScore !== undefined;
                  const hasShim = fu.shimScore?.totalScore !== undefined;
                  const hasContinence = fu.continence?.dayStatus !== undefined;

                  return (
                    <TableRow
                      key={fu.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 transition-colors"
                    >
                      {/* Patient Info */}
                      <TableCell className="py-2.5 px-3.5">
                        <Link
                          href={`/patients/${fu.patient.id}`}
                          className="font-semibold text-xs text-slate-900 dark:text-slate-100 hover:text-teal-700 dark:hover:text-teal-400 transition-colors block"
                        >
                          {fu.patient.firstName} {fu.patient.surname}
                        </Link>
                        <span className="text-[11px] text-slate-400 font-mono [font-variant-numeric:tabular-nums] block mt-0.5">
                          MRN: {fu.patient.hospitalNumber} • NHS: {fu.patient.nhsNumber}
                        </span>
                      </TableCell>

                      {/* Milestone */}
                      <TableCell className="py-2.5 px-3.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {fu.milestone.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ({fu.targetMonths}m)
                        </span>
                      </TableCell>

                      {/* Surgeon */}
                      <TableCell className="py-2.5 px-3.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {fu.patient.primarySurgeon}
                        </span>
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className="py-2.5 px-3.5 text-xs font-mono [font-variant-numeric:tabular-nums] text-slate-700 dark:text-slate-300">
                        {formatDate(fu.dueDate)}
                      </TableCell>

                      {/* PSA Status */}
                      <TableCell className="py-2.5 px-3.5 text-xs font-mono [font-variant-numeric:tabular-nums]">
                        {hasPsa ? (
                          <span
                            className={
                              fu.biochemicalRecurrence
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : 'text-teal-700 dark:text-teal-300 font-bold'
                            }
                          >
                            {formatPsa(fu.psa)} {fu.biochemicalRecurrence && '⚠️'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal text-[11px]">Pending PSA</span>
                        )}
                      </TableCell>

                      {/* PROM Checklist */}
                      <TableCell className="py-2.5 px-3.5 text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span
                            className={
                              hasIpss
                                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                : 'text-slate-400 dark:text-slate-500'
                            }
                            title="IPSS Urinary Function"
                          >
                            IPSS {hasIpss ? '✓' : '✕'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span
                            className={
                              hasShim
                                ? 'text-purple-700 dark:text-purple-400 font-semibold'
                                : 'text-slate-400 dark:text-slate-500'
                            }
                            title="SHIM Potency Recovery"
                          >
                            SHIM {hasShim ? '✓' : '✕'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span
                            className={
                              hasContinence
                                ? 'text-blue-700 dark:text-blue-400 font-semibold'
                                : 'text-slate-400 dark:text-slate-500'
                            }
                            title="Continence Recovery"
                          >
                            Cont {hasContinence ? '✓' : '✕'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2.5 px-3.5">
                        {fu.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                            <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>Completed</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{dueLabel}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{dueLabel}</span>
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-2.5 px-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {fu.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant={isDispatched ? 'secondary' : 'default'}
                              className={`h-7 gap-1 text-[11px] px-2.5 font-semibold rounded ${
                                isDispatched
                                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-2xs'
                              }`}
                              disabled={isDispatched}
                              onClick={() => handleRequestResponse(fu)}
                            >
                              {isDispatched ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                                  <span>Requested</span>
                                </>
                              ) : (
                                <>
                                  <Send className="h-3 w-3" aria-hidden="true" />
                                  <span>Request PROMs</span>
                                </>
                              )}
                            </Button>
                          )}
                          <Link href={`/patients/${fu.patient.id}/follow-ups`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] px-2 font-medium border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            >
                              <span>Record</span>
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Enterprise Data Grid Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/90 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-1 text-xs">
            <span>
              Showing <strong className="font-mono [font-variant-numeric:tabular-nums] text-slate-900 dark:text-white">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="font-mono [font-variant-numeric:tabular-nums] text-slate-900 dark:text-white">{Math.min(startIndex + pageSize, totalRecords)}</strong> of{' '}
              <strong className="font-mono [font-variant-numeric:tabular-nums] text-slate-900 dark:text-white">{totalRecords.toLocaleString()}</strong> records
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded border-slate-200 dark:border-slate-700"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              aria-label="Go to first page"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded border-slate-200 dark:border-slate-700"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Go to previous page"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>

            <span className="px-2 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded border-slate-200 dark:border-slate-700"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Go to next page"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded border-slate-200 dark:border-slate-700"
              disabled={currentPage >= totalPages}
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

export function FollowUpStatus({ status }: { status: string }) {
  return <Badge variant="outline">{status}</Badge>;
}

export function FollowUpMissingData() {
  return null;
}
