'use client';

import React, { useState } from 'react';
import { OperationData, BladderNeckStatus, NerveSparingSide, NerveSparingGrade, SurgicalQualityGrade } from '@/types/operation';
import { SurgeonCode } from '@/types/common';
import { PatientDataSection, PatientDataField } from '@/components/patient/patient-completeness';
import { formatDate, formatBloodLoss, formatDuration } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField, FormLabel } from '@/components/ui/form';
import {
  SURGEON_OPTIONS,
  BLADDER_NECK_OPTIONS,
  NERVE_SPARING_OPTIONS,
  NERVE_SPARING_GRADES,
  SURGICAL_QUALITY_OPTIONS,
} from '@/config/clinical-options';
import { Edit2, Save, X, Scissors, ShieldAlert, Sparkles } from 'lucide-react';
import { db } from '@/lib/api-client';

export function OperationSummary({
  patientId,
  data,
  onUpdate,
}: {
  patientId: string;
  data?: OperationData;
  onUpdate?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<OperationData>>(
    data || {
      surgeon: 'VK',
      operationDate: new Date().toISOString().split('T')[0],
      bladderNeck: 'sparing',
      nerveSparing: 'Bilateral',
      leftNerveSparingGrade: '5/5',
      rightNerveSparingGrade: '5/5',
      sphincter: 'Excellent',
      anteriorReconstruction: 'Good',
      lymphNodeDissection: false,
      bloodLossMl: 200,
      durationMinutes: 140,
    }
  );

  const handleSave = () => {
    if (!formData.operationDate || !formData.surgeon) return;
    db.updateOperation(patientId, formData as OperationData);
    setIsEditing(false);
    onUpdate?.();
  };

  if (isEditing) {
    return (
      <PatientDataSection
        title="Edit Surgical Theatre Operation Note"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save Operation
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {/* Surgeon */}
          <FormField>
            <FormLabel>Primary Surgeon *</FormLabel>
            <Select
              value={formData.surgeon || 'VK'}
              onChange={(e) => setFormData({ ...formData, surgeon: e.target.value as SurgeonCode })}
            >
              {SURGEON_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.fullName} ({s.value})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Operation Date */}
          <FormField>
            <FormLabel>Operation Date *</FormLabel>
            <Input
              type="date"
              value={formData.operationDate || ''}
              onChange={(e) => setFormData({ ...formData, operationDate: e.target.value })}
            />
          </FormField>

          {/* Bladder Neck */}
          <FormField>
            <FormLabel>Bladder Neck Preservation *</FormLabel>
            <Select
              value={formData.bladderNeck || 'sparing'}
              onChange={(e) => setFormData({ ...formData, bladderNeck: e.target.value as BladderNeckStatus })}
            >
              {BLADDER_NECK_OPTIONS.map((bn) => (
                <option key={bn.value} value={bn.value}>
                  {bn.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Nerve Sparing Side */}
          <FormField>
            <FormLabel>Nerve Sparing Extent *</FormLabel>
            <Select
              value={formData.nerveSparing || 'Bilateral'}
              onChange={(e) => {
                const side = e.target.value as NerveSparingSide;
                setFormData({
                  ...formData,
                  nerveSparing: side,
                  leftNerveSparingGrade: side === 'None' || side === 'Right' ? 'N/A' : (formData.leftNerveSparingGrade === 'N/A' ? '5/5' : formData.leftNerveSparingGrade),
                  rightNerveSparingGrade: side === 'None' || side === 'Left' ? 'N/A' : (formData.rightNerveSparingGrade === 'N/A' ? '5/5' : formData.rightNerveSparingGrade),
                });
              }}
            >
              {NERVE_SPARING_OPTIONS.map((ns) => (
                <option key={ns.value} value={ns.value}>
                  {ns.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Left Nerve Sparing Grade - Conditional */}
          {(formData.nerveSparing === 'Bilateral' || formData.nerveSparing === 'Left') && (
            <FormField>
              <FormLabel>Left Nerve Sparing Grade (2/5 - 5/5) *</FormLabel>
              <Select
                value={formData.leftNerveSparingGrade || '5/5'}
                onChange={(e) => setFormData({ ...formData, leftNerveSparingGrade: e.target.value as NerveSparingGrade })}
              >
                {NERVE_SPARING_GRADES.filter((g) => g.value !== 'N/A').map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Right Nerve Sparing Grade - Conditional */}
          {(formData.nerveSparing === 'Bilateral' || formData.nerveSparing === 'Right') && (
            <FormField>
              <FormLabel>Right Nerve Sparing Grade (2/5 - 5/5) *</FormLabel>
              <Select
                value={formData.rightNerveSparingGrade || '5/5'}
                onChange={(e) => setFormData({ ...formData, rightNerveSparingGrade: e.target.value as NerveSparingGrade })}
              >
                {NERVE_SPARING_GRADES.filter((g) => g.value !== 'N/A').map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {formData.nerveSparing === 'None' && (
            <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-500 italic">
              Non-nerve sparing procedure selected (Nerve sparing grade: N/A)
            </div>
          )}

          {/* Sphincter */}
          <FormField>
            <FormLabel>External Urethral Sphincter *</FormLabel>
            <Select
              value={formData.sphincter || 'Good'}
              onChange={(e) => setFormData({ ...formData, sphincter: e.target.value as SurgicalQualityGrade })}
            >
              {SURGICAL_QUALITY_OPTIONS.map((sq) => (
                <option key={sq.value} value={sq.value}>
                  {sq.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Anterior Reconstruction */}
          <FormField>
            <FormLabel>Anterior Reconstruction *</FormLabel>
            <Select
              value={formData.anteriorReconstruction || 'Good'}
              onChange={(e) => setFormData({ ...formData, anteriorReconstruction: e.target.value as SurgicalQualityGrade })}
            >
              {SURGICAL_QUALITY_OPTIONS.map((sq) => (
                <option key={sq.value} value={sq.value}>
                  {sq.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Lymph Node Dissection */}
          <FormField>
            <FormLabel>Lymph Node Dissection (PLND)</FormLabel>
            <Select
              value={formData.lymphNodeDissection ? 'yes' : 'no'}
              onChange={(e) => setFormData({ ...formData, lymphNodeDissection: e.target.value === 'yes' })}
            >
              <option value="no">No (Omitted)</option>
              <option value="yes">Yes (Pelvic LND performed)</option>
            </Select>
          </FormField>

          {/* Blood Loss */}
          <FormField>
            <FormLabel>Estimated Blood Loss (mL) (100 - 1500 mL)</FormLabel>
            <Input
              type="number"
              min="50"
              max="2500"
              step="50"
              value={formData.bloodLossMl || ''}
              onChange={(e) => setFormData({ ...formData, bloodLossMl: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g. 250"
            />
          </FormField>

          {/* Duration of Operation */}
          <FormField>
            <FormLabel>Duration of Op (mins)</FormLabel>
            <Input
              type="number"
              min="30"
              max="600"
              value={formData.durationMinutes || ''}
              onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g. 145"
            />
          </FormField>
        </div>
      </PatientDataSection>
    );
  }

  return (
    <PatientDataSection
      title="Surgical Theatre Operation Record"
      action={
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
          <Edit2 className="h-3.5 w-3.5" /> Edit Operation Record
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <PatientDataField
          label="Lead Surgeon"
          value={data?.surgeon ? SURGEON_OPTIONS.find((s) => s.value === data.surgeon)?.fullName : undefined}
          badge={<Badge variant="default">{data?.surgeon || 'VK'}</Badge>}
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', importedDate: data?.operationDate, verified: true, verifiedBy: 'VK' }}
        />

        <PatientDataField
          label="Operation Date"
          value={formatDate(data?.operationDate)}
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', importedDate: data?.operationDate, verified: true }}
        />

        <PatientDataField
          label="Bladder Neck"
          value={data?.bladderNeck}
          badge={
            data?.bladderNeck === 'sparing' ? (
              <Badge variant="success">Sparing</Badge>
            ) : data?.bladderNeck === 'slight wide' ? (
              <Badge variant="warning">Slight Wide</Badge>
            ) : (
              <Badge variant="destructive">Reconstructed</Badge>
            )
          }
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Nerve Sparing Side"
          value={data?.nerveSparing}
          badge={
            data?.nerveSparing === 'Bilateral' ? (
              <Badge variant="success">Bilateral</Badge>
            ) : data?.nerveSparing === 'None' ? (
              <Badge variant="secondary">Non-Sparing</Badge>
            ) : (
              <Badge variant="info">Unilateral ({data?.nerveSparing})</Badge>
            )
          }
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Left Nerve Sparing Grade"
          value={data?.leftNerveSparingGrade ? `Grade ${data.leftNerveSparingGrade}` : undefined}
          helpText="Intrafascial / Interfascial"
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Right Nerve Sparing Grade"
          value={data?.rightNerveSparingGrade ? `Grade ${data.rightNerveSparingGrade}` : undefined}
          helpText="Intrafascial / Interfascial"
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="External Sphincter"
          value={data?.sphincter}
          badge={
            data?.sphincter === 'Excellent' ? (
              <Badge variant="success">Excellent</Badge>
            ) : data?.sphincter === 'Good' ? (
              <Badge variant="info">Good</Badge>
            ) : (
              <Badge variant="destructive">Weak</Badge>
            )
          }
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Anterior Reconstruction"
          value={data?.anteriorReconstruction}
          badge={
            data?.anteriorReconstruction === 'Excellent' ? (
              <Badge variant="success">Excellent</Badge>
            ) : (
              <Badge variant="info">{data?.anteriorReconstruction || 'Good'}</Badge>
            )
          }
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Lymph Node Dissection"
          value={data?.lymphNodeDissection ? `Yes (${data.lymphNodeCount || 'standard'} nodes)` : 'No (Omitted)'}
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Blood Loss"
          value={formatBloodLoss(data?.bloodLossMl)}
          badge={data?.bloodLossMl && data.bloodLossMl > 500 ? <Badge variant="warning">Elevated</Badge> : undefined}
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Duration of Operation"
          value={formatDuration(data?.durationMinutes)}
          helpText={data?.consoleDurationMinutes ? `Console: ${data.consoleDurationMinutes} mins` : undefined}
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />

        <PatientDataField
          label="Robot Platform"
          value={data?.robotType || 'DaVinci Xi'}
          source={{ type: 'Operation Note', documentTitle: 'Robotic Theatre Note', verified: true }}
        />
      </div>

      {data?.notes && (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-600 dark:text-slate-300">
          <strong>Intra-operative Notes:</strong> {data.notes}
        </div>
      )}
    </PatientDataSection>
  );
}
