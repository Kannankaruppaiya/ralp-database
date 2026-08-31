'use client';

import React, { useState } from 'react';
import { HistologyData, PathologicalStage, MarginStatus } from '@/types/histology';
import { GleasonGrade, GradeGroup } from '@/types/cancer';
import { PatientDataSection, PatientDataField } from '@/components/patient/patient-completeness';
import { formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField, FormLabel } from '@/components/ui/form';
import {
  GLEASON_OPTIONS,
  GRADE_GROUP_MAP,
  PATHOLOGICAL_STAGE_OPTIONS,
} from '@/config/clinical-options';
import { Edit2, Save, X, Microscope, CheckCircle2, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/api-client';

export function HistologySummary({
  patientId,
  data,
  onUpdate,
}: {
  patientId: string;
  data?: HistologyData;
  onUpdate?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<HistologyData>>(
    data || {
      reportDate: new Date().toISOString().split('T')[0],
      gleasonGrade: '3+4',
      gradeGroup: 2,
      pathologicalStage: '2C',
      surgicalMargins: 'Negative (R0)',
      extraprostaticExtension: false,
      seminalVesicleInvasion: false,
    }
  );

  const handleGleasonChange = (gleason: GleasonGrade) => {
    const gg = GRADE_GROUP_MAP[gleason] || 1;
    setFormData((prev) => ({ ...prev, gleasonGrade: gleason, gradeGroup: gg }));
  };

  const handleSave = () => {
    if (!formData.reportDate || !formData.gleasonGrade || !formData.pathologicalStage) return;
    db.updateHistology(patientId, formData as HistologyData);
    setIsEditing(false);
    onUpdate?.();
  };

  if (isEditing) {
    return (
      <PatientDataSection
        title="Edit Post-Operative Histology Report"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save Histology
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {/* Report Date */}
          <FormField>
            <FormLabel>Pathology Report Date *</FormLabel>
            <Input
              type="date"
              value={formData.reportDate || ''}
              onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
            />
          </FormField>

          {/* Histology Gleason Grade */}
          <FormField>
            <FormLabel>Pathological Gleason Grade *</FormLabel>
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

          {/* Pathological Stage */}
          <FormField>
            <FormLabel>Pathological Stage (pTNM) *</FormLabel>
            <Select
              value={formData.pathologicalStage || '2C'}
              onChange={(e) => setFormData({ ...formData, pathologicalStage: e.target.value as PathologicalStage })}
            >
              {PATHOLOGICAL_STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  Stage {stage} (pT{stage})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Surgical Margins */}
          <FormField>
            <FormLabel>Surgical Margins Status *</FormLabel>
            <Select
              value={formData.surgicalMargins || 'Negative (R0)'}
              onChange={(e) => setFormData({ ...formData, surgicalMargins: e.target.value as MarginStatus })}
            >
              <option value="Negative (R0)">Negative (R0) - Clear margins</option>
              <option value="Positive (R1)">Positive (R1) - Tumour at inked margin</option>
              <option value="Uncertain (Rx)">Uncertain (Rx)</option>
            </Select>
          </FormField>

          {/* Extraprostatic Extension */}
          <FormField>
            <FormLabel>Extraprostatic Extension (EPE)</FormLabel>
            <Select
              value={formData.extraprostaticExtension ? 'yes' : 'no'}
              onChange={(e) => setFormData({ ...formData, extraprostaticExtension: e.target.value === 'yes' })}
            >
              <option value="no">No (Organ Confined)</option>
              <option value="yes">Yes (EPE Identified - pT3a)</option>
            </Select>
          </FormField>

          {/* Seminal Vesicle Invasion */}
          <FormField>
            <FormLabel>Seminal Vesicle Invasion (SVI)</FormLabel>
            <Select
              value={formData.seminalVesicleInvasion ? 'yes' : 'no'}
              onChange={(e) => setFormData({ ...formData, seminalVesicleInvasion: e.target.value === 'yes' })}
            >
              <option value="no">No (SV Clear)</option>
              <option value="yes">Yes (SVI Identified - pT3b)</option>
            </Select>
          </FormField>

          {/* Specimen Weight */}
          <FormField>
            <FormLabel>Specimen Weight (grams)</FormLabel>
            <Input
              type="number"
              step="0.1"
              value={formData.specimenWeightGrams ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  // parseInt discarded the decimal a pathologist actually reported;
                  // the column is numeric(6,1). Blank clears rather than storing 0.
                  specimenWeightGrams: e.target.value === '' ? undefined : parseFloat(e.target.value),
                })
              }
              placeholder="e.g. 48.5"
            />
          </FormField>
        </div>
      </PatientDataSection>
    );
  }

  return (
    <PatientDataSection
      title="Post-Operative Pathology & Histology Report"
      action={
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
          <Edit2 className="h-3.5 w-3.5" /> Edit Histology
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <PatientDataField
          label="Report Date"
          value={formatDate(data?.reportDate)}
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', importedDate: data?.reportDate, verified: true }}
        />

        <PatientDataField
          label="Pathology Gleason Score"
          value={data?.gleasonGrade}
          badge={data?.gradeGroup ? <Badge variant="purple">Grade Group {data.gradeGroup}</Badge> : undefined}
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', verified: true }}
        />

        <PatientDataField
          label="Pathological Stage"
          value={data?.pathologicalStage ? `pT${data.pathologicalStage}` : undefined}
          badge={<Badge variant="outline">Stage {data?.pathologicalStage}</Badge>}
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', verified: true }}
        />

        <PatientDataField
          label="Surgical Margins"
          value={data?.surgicalMargins}
          badge={
            data?.surgicalMargins?.includes('Positive') ? (
              <Badge variant="destructive">Positive Margin</Badge>
            ) : (
              <Badge variant="success">Clear (R0)</Badge>
            )
          }
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', verified: true }}
        />

        <PatientDataField
          label="Extraprostatic Extension (EPE)"
          value={data?.extraprostaticExtension ? 'Yes (Identified)' : 'No (Absent)'}
          badge={data?.extraprostaticExtension ? <Badge variant="warning">pT3a</Badge> : <Badge variant="secondary">Organ Confined</Badge>}
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', verified: true }}
        />

        <PatientDataField
          label="Seminal Vesicle Invasion (SVI)"
          value={data?.seminalVesicleInvasion ? 'Yes (Invasion present)' : 'No (Clear)'}
          badge={data?.seminalVesicleInvasion ? <Badge variant="destructive">pT3b</Badge> : undefined}
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', verified: true }}
        />

        <PatientDataField
          label="Specimen Weight"
          value={data?.specimenWeightGrams ? `${data.specimenWeightGrams} g` : undefined}
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', verified: true }}
        />

        <PatientDataField
          label="Tertiary Pattern"
          value={data?.tertiaryPattern || 'None'}
          source={{ type: 'Histology Report', documentTitle: 'Prostatectomy Histopathology', verified: true }}
        />
      </div>

      {data?.notes && (
        <div className="mt-4 p-3 bg-muted dark:bg-slate-800/40 rounded-lg text-xs text-muted-foreground dark:text-slate-300">
          <strong>Pathologist Remarks:</strong> {data.notes}
        </div>
      )}
    </PatientDataSection>
  );
}

export function HistologyForm({ patientId }: { patientId: string }) {
  return <HistologySummary patientId={patientId} />;
}
