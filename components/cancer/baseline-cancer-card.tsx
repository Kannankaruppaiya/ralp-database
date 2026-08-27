'use client';

import React, { useState } from 'react';
import { BaselineCancerData, GleasonGrade, GradeGroup, ClinicalStage } from '@/types/cancer';
import { PatientDataSection, PatientDataField } from '@/components/patient/patient-completeness';
import { formatPsa, formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField, FormLabel } from '@/components/ui/form';
import { GLEASON_OPTIONS, GRADE_GROUP_MAP, CLINICAL_STAGE_OPTIONS } from '@/config/clinical-options';
import { Edit2, Save, X, Dna, Info } from 'lucide-react';
import { db } from '@/lib/api-client';

export function BaselineCancerCard({
  patientId,
  data,
  onUpdate,
}: {
  patientId: string;
  data?: BaselineCancerData;
  onUpdate?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BaselineCancerData>>(
    data || {
      psa: 0,
      gleasonGrade: '3+4',
      gradeGroup: 2,
      percentPositiveCoresWorst: 50,
      percentPositiveCoresBest: 20,
      ukbScore: 40,
      clinicalStage: '2B',
    }
  );

  const handleGleasonChange = (gleason: GleasonGrade) => {
    const gg = GRADE_GROUP_MAP[gleason] || 1;
    setFormData((prev) => ({ ...prev, gleasonGrade: gleason, gradeGroup: gg }));
  };

  const handleSave = () => {
    if (!formData.psa || !formData.gleasonGrade || !formData.clinicalStage) return;
    db.updateBaseline(patientId, formData as BaselineCancerData);
    setIsEditing(false);
    onUpdate?.();
  };

  if (isEditing) {
    return (
      <PatientDataSection
        title="Edit Pre-Operative Cancer Baseline"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save Baseline
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {/* PSA Input */}
          <FormField>
            <FormLabel>Pre-Op PSA (ng/mL) *</FormLabel>
            <Input
              type="number"
              step="0.01"
              value={formData.psa || ''}
              onChange={(e) => setFormData({ ...formData, psa: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 8.4"
            />
          </FormField>

          {/* Gleason Grade */}
          <FormField>
            <FormLabel>Biopsy Gleason Grade *</FormLabel>
            <Select
              value={formData.gleasonGrade || '3+4'}
              onChange={(e) => handleGleasonChange(e.target.value as GleasonGrade)}
            >
              {GLEASON_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g} (Grade Group {GRADE_GROUP_MAP[g]})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Clinical Stage */}
          <FormField>
            <FormLabel>Clinical Stage (cTNM) *</FormLabel>
            <Select
              value={formData.clinicalStage || '2A'}
              onChange={(e) => setFormData({ ...formData, clinicalStage: e.target.value as ClinicalStage })}
            >
              {CLINICAL_STAGE_OPTIONS.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* % Cores Worst */}
          <FormField>
            <FormLabel>% Positive Cores (Worst Grade) (1-100%)</FormLabel>
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.percentPositiveCoresWorst || ''}
              onChange={(e) => setFormData({ ...formData, percentPositiveCoresWorst: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g. 50"
            />
          </FormField>

          {/* % Cores Best */}
          <FormField>
            <FormLabel>% Positive Cores (Best Grade) (1-100%)</FormLabel>
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.percentPositiveCoresBest || ''}
              onChange={(e) => setFormData({ ...formData, percentPositiveCoresBest: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g. 20"
            />
          </FormField>

          {/* UKB Score */}
          <FormField>
            <FormLabel>UKB Score (1-100)</FormLabel>
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.ukbScore || ''}
              onChange={(e) => setFormData({ ...formData, ukbScore: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g. 42"
            />
          </FormField>
        </div>
      </PatientDataSection>
    );
  }

  return (
    <PatientDataSection
      title="Pre-Operative Cancer Baseline"
      action={
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
          <Edit2 className="h-3.5 w-3.5" /> Edit Baseline
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <PatientDataField
          label="Pre-Op PSA"
          value={formatPsa(data?.psa)}
          badge={data?.psa && data.psa > 20 ? <Badge variant="destructive">High</Badge> : undefined}
          helpText={data?.psaDate ? `Sampled on ${formatDate(data.psaDate)}` : undefined}
          source={{ type: 'Clinic Letter', documentTitle: 'MDT Referral Letter', importedDate: data?.psaDate, verified: true }}
        />

        <PatientDataField
          label="Biopsy Gleason Score"
          value={data?.gleasonGrade ? `${data.gleasonGrade}` : undefined}
          badge={
            data?.gradeGroup ? (
              <Badge variant="info">Grade Group {data.gradeGroup}</Badge>
            ) : undefined
          }
          source={{ type: 'Histology Report', documentTitle: 'Targeted Prostate Biopsy Report', verified: true }}
        />

        <PatientDataField
          label="Clinical Stage"
          value={data?.clinicalStage ? `Stage ${data.clinicalStage}` : undefined}
          helpText={CLINICAL_STAGE_OPTIONS.find((s) => s.value === data?.clinicalStage)?.description}
          source={{ type: 'MDT Outcome', documentTitle: 'Urology MDT Staging', verified: true }}
        />

        <PatientDataField
          label="UKB Score"
          value={data?.ukbScore ? `${data.ukbScore} / 100` : undefined}
          source={{ type: 'Clinic Letter', documentTitle: 'Biopsy Risk Assessment', verified: true }}
        />

        <PatientDataField
          label="% Positive Cores (Worst)"
          value={data?.percentPositiveCoresWorst ? `${data.percentPositiveCoresWorst}%` : undefined}
          helpText="Highest involvement core"
          source={{ type: 'Histology Report', documentTitle: 'Biopsy Pathology', verified: true }}
        />

        <PatientDataField
          label="% Positive Cores (Best)"
          value={data?.percentPositiveCoresBest ? `${data.percentPositiveCoresBest}%` : undefined}
          helpText="Lowest involvement core"
          source={{ type: 'Histology Report', documentTitle: 'Biopsy Pathology', verified: true }}
        />

        <PatientDataField
          label="mpMRI PI-RADS"
          value={data?.mriPIRADS ? `PI-RADS ${data.mriPIRADS}/5` : undefined}
          source={{ type: 'Clinic Letter', documentTitle: 'Pre-op mpMRI Report', verified: true }}
        />

        <PatientDataField
          label="Prostate Volume"
          value={data?.prostateVolumeCc ? `${data.prostateVolumeCc} cc` : undefined}
          source={{ type: 'Clinic Letter', documentTitle: 'Pre-op mpMRI Report', verified: true }}
        />
      </div>

      {data?.notes && (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-600 dark:text-slate-300">
          <strong>Biopsy / MDT Notes:</strong> {data.notes}
        </div>
      )}
    </PatientDataSection>
  );
}

export function PSACard({ psa, psaDate }: { psa?: number; psaDate?: string }) {
  return (
    <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">Pre-Op PSA</span>
        <Dna className="h-4 w-4 text-cyan-600" />
      </div>
      <div className="text-2xl font-bold text-cyan-950 dark:text-cyan-100 mt-1">
        {formatPsa(psa)}
      </div>
      {psaDate && <div className="text-[11px] text-cyan-700 mt-1">{formatDate(psaDate)}</div>}
    </div>
  );
}
