'use client';

import React, { useState } from 'react';
import { FollowUpRecord } from '@/types/follow-up';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField, FormLabel } from '@/components/ui/form';
import { formatDate, formatPsa } from '@/lib/formatters';
import { getDaysRemaining } from '@/lib/date';
import { INCONTINENCE_DAY_OPTIONS } from '@/config/clinical-options';
import { IncontinenceDayStatus } from '@/types/prom';
import { CalendarClock, CheckCircle2, AlertCircle, Clock, Edit2, Save, X, ExternalLink } from 'lucide-react';
import { db } from '@/lib/api-client';
import Link from 'next/link';

export function FollowUpCard({
  followUp,
  patientId,
  onUpdate,
}: {
  followUp: FollowUpRecord;
  patientId: string;
  onUpdate?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FollowUpRecord>>(followUp);
  const { isOverdue, label: dueLabel } = getDaysRemaining(followUp.dueDate);

  const handleSave = async () => {
    const updated: FollowUpRecord = {
      ...followUp,
      ...formData,
      status: formData.psa !== undefined || formData.ipssScore !== undefined ? 'completed' : followUp.status,
      completedDate: formData.completedDate || (formData.psa !== undefined ? new Date().toISOString().split('T')[0] : undefined),
    } as FollowUpRecord;

    setIsSaving(true);
    setSaveError(null);
    try {
      // Await the write before refreshing: the parent re-reads from the
      // database, so firing it early shows the row as it was before the save.
      await db.updateFollowUp(patientId, updated);
      setIsEditing(false);
      onUpdate?.();
    } catch (e) {
      // A failed write used to be silent, leaving a clinician believing a PSA
      // had been recorded when nothing was stored.
      setSaveError(e instanceof Error ? e.message : 'Could not save this milestone.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (followUp.status === 'completed') {
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
    }
    if (followUp.status === 'overdue' || isOverdue) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> {dueLabel}</Badge>;
    }
    return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> {dueLabel}</Badge>;
  };

  if (isEditing) {
    return (
      <Card className="border-teal-500 shadow-md">
        <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold text-slate-900">
            Edit {followUp.milestone.toUpperCase()} Follow-up ({followUp.targetMonths} Months)
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" disabled={isSaving} onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="default" size="sm" disabled={isSaving} onClick={() => void handleSave()}>
              <Save className="h-4 w-4 mr-1" /> {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs">
          {saveError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-700">
              {saveError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FormField>
              <FormLabel>Serum PSA (ng/mL)</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={formData.psa ?? ''}
                onChange={(e) => setFormData({ ...formData, psa: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 0.01"
              />
            </FormField>

            <FormField>
              <FormLabel>Continence Status</FormLabel>
              <Select
                value={formData.continence?.dayStatus || 'Completely dry, no pad'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    continence: {
                      dayStatus: e.target.value as IncontinenceDayStatus,
                      nightPads: formData.continence?.nightPads ?? 0,
                    },
                  })
                }
              >
                {INCONTINENCE_DAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField>
              <FormLabel>IPSS Score (0-35)</FormLabel>
              <Input
                type="number"
                min="0"
                max="35"
                value={formData.ipssScore?.totalScore ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ipssScore: {
                      totalScore: parseInt(e.target.value, 10) || 0,
                      qualityOfLife: 1,
                      severity: (parseInt(e.target.value, 10) || 0) >= 20 ? 'Severe' : (parseInt(e.target.value, 10) || 0) >= 8 ? 'Moderate' : 'Mild',
                    },
                  })
                }
                placeholder="0-35"
              />
            </FormField>

            <FormField>
              <FormLabel>SHIM Score (1-25)</FormLabel>
              <Input
                type="number"
                min="1"
                max="25"
                value={formData.shimScore?.totalScore ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shimScore: {
                      totalScore: parseInt(e.target.value, 10) || 1,
                      severity: (parseInt(e.target.value, 10) || 1) >= 22 ? 'No ED' : (parseInt(e.target.value, 10) || 1) >= 17 ? 'Mild ED' : 'Moderate ED',
                    },
                  })
                }
                placeholder="1-25"
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel>Clinical Notes</FormLabel>
            <Input
              value={formData.clinicalNotes || ''}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
              placeholder="Clinical observations, consultation details..."
            />
          </FormField>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{followUp.milestone.toUpperCase()} Milestone</span>
            <span className="text-xs font-normal text-slate-500">({followUp.targetMonths} Months Post-Op)</span>
          </CardTitle>
          <span className="text-xs text-slate-500">Target Due: {formatDate(followUp.dueDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 px-2 text-slate-500">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">Serum PSA</span>
            <strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
              {followUp.psa !== undefined ? formatPsa(followUp.psa) : '—'}
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">Continence</span>
            <strong className="text-slate-900 dark:text-slate-100 font-semibold truncate block">
              {followUp.continence?.dayStatus?.split(',')[0] || '—'}
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">IPSS Score</span>
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
              {followUp.ipssScore?.totalScore !== undefined ? `${followUp.ipssScore.totalScore}/35` : '—'}
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block text-[11px]">SHIM (Potency)</span>
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
              {followUp.shimScore?.totalScore !== undefined ? `${followUp.shimScore.totalScore}/25` : '—'}
            </strong>
          </div>
        </div>

        {followUp.clinicalNotes && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 border-t pt-2 italic">
            &ldquo;{followUp.clinicalNotes}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function FollowUpTimeline({
  followUps,
  patientId,
  onUpdate,
}: {
  followUps: FollowUpRecord[];
  patientId: string;
  onUpdate?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-teal-600" />
          <span>7-Milestone Longitudinal Follow-up Protocol</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {followUps.map((fu) => (
          <FollowUpCard key={fu.id} followUp={fu} patientId={patientId} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}
