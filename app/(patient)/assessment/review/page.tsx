'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/api-client';
import { useCurrentPatient } from '@/lib/auth';
import { useAssessmentDraft } from '@/hooks/use-assessment-draft';
import { CheckCircle2, ShieldCheck, ArrowLeft, ArrowRight, Activity, Sparkles, Droplet } from 'lucide-react';
import Link from 'next/link';

export default function AssessmentReviewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { patient, isLoading } = useCurrentPatient();
  const { draft, clear } = useAssessmentDraft();

  const handleSubmit = async () => {
    if (!patient) return;
    setIsSubmitting(true);
    setError(null);

    // The earliest milestone still open is the one this assessment answers.
    const targetMilestone =
      patient.followUps?.find((f) => f.status !== 'completed')?.milestone || '6m';

    try {
      // One atomic submission carrying all three questionnaires. A database
      // trigger closes the matching follow-up milestone.
      await db.addPromSubmission(patient.id, {
        patientId: patient.id,
        milestone: targetMilestone,
        completedAt: new Date().toISOString(),
        completedBy: 'patient',
        ipssAnswers: draft.ipssAnswers,
        ipssScore: draft.ipssScore,
        shimAnswers: draft.shimAnswers,
        shimScore: draft.shimScore,
        continence: draft.continence,
      });

      clear();
      router.push('/assessment/submitted');
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Could not submit your answers.');
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading your record...</div>;
  }

  if (!patient) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        No patient record is linked to this login. Please contact your clinical team.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Review Your Assessment Answers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Reviewing responses for <strong>{patient.firstName} {patient.surname}</strong> (NHS: {patient.nhsNumber}) before transmitting to your surgical care team.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="shadow-sm border-teal-200 bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-teal-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              <span>1. Urinary Symptoms (IPSS)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Overall Score:</span>
              <Badge variant="success">
                {draft.ipssScore
                  ? `${draft.ipssScore.severity} (Score ${draft.ipssScore.totalScore}/35)`
                  : 'Not answered'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Quality of Life / Bother:</span>
              <strong>
                {draft.ipssScore ? `${draft.ipssScore.qualityOfLife} / 6` : '—'}
              </strong>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-purple-200 bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-purple-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>2. Erectile Health (SHIM)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Overall Score:</span>
              <Badge variant="purple">
                {draft.shimScore
                  ? `${draft.shimScore.severity} (Score ${draft.shimScore.totalScore}/25)`
                  : 'Not answered'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200 bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Droplet className="h-4 w-4 text-blue-600" />
              <span>3. Pad Usage & Continence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Daytime:</span>
              <strong>{draft.continence?.dayStatus ?? 'Not answered'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Nighttime:</span>
              <strong className="text-emerald-700">
                {draft.continence ? `${draft.continence.nightPads} pad(s) at night` : '—'}
              </strong>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block">Data Security and Direct Clinical Sync</strong>
          <span>Your answers will be saved directly into your surgical record and reviewed by your Consultant Surgeon ({patient.primarySurgeon}) at your upcoming milestone review.</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Link href="/assessment/incontinence">
          <Button variant="outline" className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Modify Answers</span>
          </Button>
        </Link>
        <Button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md text-xs"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{isSubmitting ? 'Transmitting Data...' : 'Confirm & Transmit Questionnaire'}</span>
        </Button>
      </div>
    </div>
  );
}
