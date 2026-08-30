'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, HeartPulse, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AssessmentSubmittedPage() {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="max-w-lg mx-auto py-8 text-center space-y-6">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Assessment Submitted Successfully!
        </h1>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Thank you. Your responses have been automatically scored and recorded directly into your hospital surgical database record.
        </p>
      </div>

      <Card className="shadow-sm border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 text-left">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-blue-600" />
            Personalized Post-Operative Guidance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 text-xs text-slate-700 space-y-2 leading-relaxed">
          <p>
            • <strong>Continence Recovery</strong>: Your progress is consistent with expected post-RALP pelvic floor retraining. Continue your daily Kegel exercises as instructed by your clinical nurse specialist.
          </p>
          <p>
            • <strong>Potency & Nerve Sparing</strong>: Erectile function recovery is a gradual process over 12 to 24 months. Discuss penile rehabilitation options with Mr. V. Kannan at your next review.
          </p>
          <p>
            • <strong>Next Step</strong>: Your next PSA blood test will be scheduled as part of your longitudinal surveillance pathway.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link href="/home">
          <Button variant="default" className="w-full sm:w-auto">
            Back to Recovery Home
          </Button>
        </Link>
        <Link href="/follow-up">
          <Button variant="outline" className="w-full sm:w-auto">
            View My Follow-up Schedule
          </Button>
        </Link>
      </div>
    </div>
  );
}
