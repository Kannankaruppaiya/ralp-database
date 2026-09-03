'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { db } from '@/lib/api-client';
import { useCurrentPatient } from '@/lib/auth';
import { useAssessmentDraft } from '@/hooks/use-assessment-draft';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Activity,
  Sparkles,
  Droplet,
  AlertTriangle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export default function AssessmentReviewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { patient, isLoading } = useCurrentPatient();
  const { draft, clear } = useAssessmentDraft();

  const handleSubmit = async () => {
    if (!patient || !consentGiven) return;
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

      await db.audit(
        'PROM_SUBMISSION_CONSENTED',
        patient.id,
        `Patient submitted ${targetMilestone} milestone PROMs with explicit Statement of Truth and clinical data consent`
      );

      clear();
      router.push('/assessment/submitted');
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Could not submit your answers.');
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading your record…</div>;
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Review Your Assessment Answers</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Reviewing responses for <strong>{patient.firstName} {patient.surname}</strong> (NHS: {patient.nhsNumber}) before transmitting to your surgical care team.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        <Card className="shadow-sm border-teal-200 bg-white dark:bg-[#181818] dark:border-[#272727]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-teal-900 dark:text-teal-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>1. Urinary Symptoms (IPSS)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-slate-600 dark:text-slate-300 space-y-1">
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

        <Card className="shadow-sm border-purple-200 bg-white dark:bg-[#181818] dark:border-[#272727]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>2. Erectile Health (SHIM)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-slate-600 dark:text-slate-300 space-y-1">
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

        <Card className="shadow-sm border-blue-200 bg-white dark:bg-[#181818] dark:border-[#272727]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <Droplet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>3. Pad Usage & Continence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Daytime:</span>
              <strong>{draft.continence?.dayStatus ?? 'Not answered'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Nighttime:</span>
              <strong className="text-emerald-700 dark:text-emerald-400">
                {draft.continence ? `${draft.continence.nightPads} pad(s) at night` : '—'}
              </strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Emergency Notice */}
      <div className="flex items-center gap-2.5 p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-[11px] leading-tight">
          <strong>Routine monitoring only:</strong> For acute medical emergencies (severe pain, fever, inability to pass urine), call <strong>NHS 111</strong> or attend A&amp;E.
        </span>
      </div>

      {/* Clean 1-Line Consent Checkbox with Modal Trigger */}
      <div className="rounded-xl border border-slate-200 dark:border-[#272727] bg-slate-50/70 dark:bg-[#181818] p-4 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group select-none">
          <input
            type="checkbox"
            id="patient-prom-consent-checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
          />
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
            <span>
              I confirm these answers are accurate and agree to the{' '}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTermsModal(true);
              }}
              className="font-semibold text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-0.5"
            >
              <span>NHS Clinical Consent &amp; Data Sharing Terms</span>
              <ExternalLink className="h-3 w-3" />
            </button>
            <span>.</span>
          </div>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[#272727]">
        <Link href="/assessment/incontinence">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Modify Answers</span>
          </Button>
        </Link>
        <Button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !consentGiven}
          className={`gap-2 text-xs font-semibold shadow-md transition-all ${
            consentGiven
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white cursor-pointer'
              : 'opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{isSubmitting ? 'Transmitting Securely...' : 'Confirm & Transmit Questionnaire'}</span>
        </Button>
      </div>

      {/* Terms & Data Governance Dialog Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <DialogTitle>NHS Clinical Consent &amp; Data Sharing</DialogTitle>
            </div>
            <DialogDescription>
              Oxford University Hospitals NHS FT • Department of Urology
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#272727] space-y-1.5">
              <strong className="text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>1. Statement of Truth &amp; Accuracy</span>
              </strong>
              <p className="leading-relaxed text-[11px]">
                By submitting this form, you declare that the responses submitted for IPSS (urinary function), SHIM (sexual health), and pad usage accurately reflect your current health and symptoms.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#272727] space-y-1.5">
              <strong className="text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-teal-600" />
                <span>2. Direct Clinical Care &amp; Registry Use</span>
              </strong>
              <p className="leading-relaxed text-[11px]">
                Your responses are directly synced to your hospital electronic record. Your primary surgeon (Mr. {patient.primarySurgeon}) and specialist nurses will use these results to evaluate your functional recovery and tailor your follow-up consultations.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#272727] space-y-1.5">
              <strong className="text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>3. Caldicott Information Governance &amp; Security</span>
              </strong>
              <p className="leading-relaxed text-[11px]">
                Data is encrypted in transit and at rest in compliance with NHS Data Security and Protection Toolkit (DSPT) standards and ISO 27001 protocols. Anonymous statistical trends may contribute to the National Prostate Cancer Audit (NPCA).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTermsModal(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setConsentGiven(true);
                setShowTermsModal(false);
              }}
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>I Understand &amp; Agree</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
