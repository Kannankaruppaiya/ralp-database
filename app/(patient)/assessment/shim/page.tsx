'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHIMQuestionnaire } from '@/components/proms/shim/shim-questionnaire';
import { SHIMAnswers, SHIMScore } from '@/types/prom';
import { Button } from '@/components/ui/button';
import { useAssessmentDraft } from '@/hooks/use-assessment-draft';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PatientShimPage() {
  const router = useRouter();
  const [currentAnswers, setCurrentAnswers] = useState<SHIMAnswers | null>(null);
  const [currentScore, setCurrentScore] = useState<SHIMScore | null>(null);

  const { update } = useAssessmentDraft();

  const handleNext = () => {
    if (currentAnswers && currentScore) {
      update({ shimAnswers: currentAnswers, shimScore: currentScore });
    }
    router.push('/assessment/incontinence');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Step 2 of 3</span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Erectile Function Recovery (SHIM / IIEF-5)</h1>
        </div>
        <Link href="/assessment/ipss">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
        </Link>
      </div>

      <SHIMQuestionnaire
        onComplete={(answers, score) => {
          setCurrentAnswers(answers);
          setCurrentScore(score);
        }}
      />

      <div className="flex items-center justify-between pt-6 border-t">
        <Link href="/assessment/ipss">
          <Button variant="outline">Back to IPSS</Button>
        </Link>
        <Button onClick={handleNext} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <span>Continue to Continence (Step 3)</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
