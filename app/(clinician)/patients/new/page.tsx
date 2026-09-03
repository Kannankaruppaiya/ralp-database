'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField, FormLabel } from '@/components/ui/form';
import { GLEASON_OPTIONS, GRADE_GROUP_MAP, CLINICAL_STAGE_OPTIONS } from '@/config/clinical-options';
import { useSurgeons } from '@/hooks/use-surgeons';
import { useSession } from '@/lib/auth';
import { SurgeonCode } from '@/types/common';
import { GleasonGrade, ClinicalStage } from '@/types/cancer';
import { db } from '@/lib/api-client';
import { UserPlus, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPatientPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nhsNumber, setNhsNumber] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const { surgeons } = useSurgeons();
  const { user } = useSession();
  const [primarySurgeon, setPrimarySurgeon] = useState<SurgeonCode>('');

  // Default to the clinician entering the record, not to whoever happened to be
  // first in a checked-in list. Falls back to the first name on the roster for a
  // registrar or nurse specialist, who holds no surgeon code of their own.
  useEffect(() => {
    if (primarySurgeon) return;
    const mine = user?.surgeonCode;
    if (mine && surgeons.some((s) => s.value === mine)) setPrimarySurgeon(mine);
    else if (surgeons.length) setPrimarySurgeon(surgeons[0].value);
  }, [surgeons, user?.surgeonCode, primarySurgeon]);

  // Baseline data optional step
  const [psa, setPsa] = useState('');
  const [gleasonGrade, setGleasonGrade] = useState<GleasonGrade>('3+4');
  const [clinicalStage, setClinicalStage] = useState<ClinicalStage>('2A');
  const [percentPositiveWorst, setPercentPositiveWorst] = useState('50');
  const [percentPositiveBest, setPercentPositiveBest] = useState('20');
  const [ukbScore, setUkbScore] = useState('40');

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !surname.trim() || !dateOfBirth || !nhsNumber.trim() || !hospitalNumber.trim()) {
      setError('Please fill in all mandatory demographic fields (Name, DOB, NHS number, MRN).');
      return;
    }
    setError('');
    setIsSaving(true);

    try {
      const patient = await db.createPatient({
        firstName: firstName.trim(),
        surname: surname.trim(),
        dateOfBirth,
        nhsNumber: nhsNumber.trim(),
        hospitalNumber: hospitalNumber.trim(),
        primarySurgeon,
      });

      // Baseline is optional at registration; saved as its own row when given.
      if (psa) {
        await db.updateBaseline(patient.id, {
          psa: parseFloat(psa) || 0,
          psaDate: new Date().toISOString().split('T')[0],
          gleasonGrade,
          percentPositiveCoresWorst: parseInt(percentPositiveWorst, 10) || undefined,
          percentPositiveCoresBest: parseInt(percentPositiveBest, 10) || undefined,
          ukbScore: parseInt(ukbScore, 10) || undefined,
          clinicalStage,
        });
      }

      router.push(`/patients/${patient.id}`);
    } catch (err) {
      setIsSaving(false);
      setError(err instanceof Error ? err.message : 'Could not register patient record.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Register New RALP Patient"
        description="Onboard a new prostatectomy patient to the surgical outcomes database with baseline oncological profile"
        breadcrumbs={[
          { label: 'Patients Registry', href: '/patients' },
          { label: 'Register New Patient' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <Card className="shadow-sm border-slate-200/90 dark:border-slate-800">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <span>1. Mandatory Patient Demographics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-300 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField>
                <FormLabel htmlFor="firstName">First Name *</FormLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Arthur"
                  autoComplete="given-name"
                  required
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="surname">Surname *</FormLabel>
                <Input
                  id="surname"
                  name="surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="e.g. Pendleton"
                  autoComplete="family-name"
                  required
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="dateOfBirth">Date of Birth *</FormLabel>
                <Input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  autoComplete="bday"
                  required
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="nhsNumber">NHS Number (10 digits) *</FormLabel>
                <Input
                  id="nhsNumber"
                  name="nhsNumber"
                  value={nhsNumber}
                  onChange={(e) => setNhsNumber(e.target.value)}
                  placeholder="e.g. 482 910 3341"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="hospitalNumber">Hospital Number (MRN) *</FormLabel>
                <Input
                  id="hospitalNumber"
                  name="hospitalNumber"
                  value={hospitalNumber}
                  onChange={(e) => setHospitalNumber(e.target.value)}
                  placeholder="e.g. RALP-78205"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="primarySurgeon">Primary Consultant Surgeon *</FormLabel>
                <Select
                  id="primarySurgeon"
                  name="primarySurgeon"
                  value={primarySurgeon}
                  onChange={(e) => setPrimarySurgeon(e.target.value as SurgeonCode)}
                >
                  {surgeons.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.fullName} ({s.value})
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Baseline Cancer Profile */}
        <Card className="shadow-sm border-slate-200/90 dark:border-slate-800">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              2. Pre-Operative Cancer Baseline (Optional / Initial Diagnostic)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField>
                <FormLabel htmlFor="psa">Pre-Op PSA (ng/mL)</FormLabel>
                <Input
                  id="psa"
                  type="number"
                  step="0.01"
                  name="psa"
                  value={psa}
                  onChange={(e) => setPsa(e.target.value)}
                  placeholder="e.g. 8.4"
                  spellCheck={false}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="gleasonGrade">Biopsy Gleason Grade</FormLabel>
                <Select
                  id="gleasonGrade"
                  name="gleasonGrade"
                  value={gleasonGrade}
                  onChange={(e) => setGleasonGrade(e.target.value as GleasonGrade)}
                >
                  {GLEASON_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g} (Grade Group {GRADE_GROUP_MAP[g]})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField>
                <FormLabel htmlFor="clinicalStage">Clinical Stage</FormLabel>
                <Select
                  id="clinicalStage"
                  name="clinicalStage"
                  value={clinicalStage}
                  onChange={(e) => setClinicalStage(e.target.value as ClinicalStage)}
                >
                  {CLINICAL_STAGE_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField>
                <FormLabel htmlFor="percentPositiveWorst">% Positive Cores (Worst Grade)</FormLabel>
                <Input
                  id="percentPositiveWorst"
                  type="number"
                  name="percentPositiveWorst"
                  value={percentPositiveWorst}
                  onChange={(e) => setPercentPositiveWorst(e.target.value)}
                  placeholder="e.g. 50"
                  spellCheck={false}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="percentPositiveBest">% Positive Cores (Best Grade)</FormLabel>
                <Input
                  id="percentPositiveBest"
                  type="number"
                  name="percentPositiveBest"
                  value={percentPositiveBest}
                  onChange={(e) => setPercentPositiveBest(e.target.value)}
                  placeholder="e.g. 20"
                  spellCheck={false}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="ukbScore">UKB Score (1-100)</FormLabel>
                <Input
                  id="ukbScore"
                  type="number"
                  name="ukbScore"
                  value={ukbScore}
                  onChange={(e) => setUkbScore(e.target.value)}
                  placeholder="e.g. 40"
                  spellCheck={false}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/patients">
            <Button variant="ghost" type="button" className="gap-1.5 text-xs font-semibold">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Cancel</span>
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving} className="gap-2 shadow-sm font-bold">
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Create Patient & Initialize Schedule</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
