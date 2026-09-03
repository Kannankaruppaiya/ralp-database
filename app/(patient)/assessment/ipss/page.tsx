'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IPSSQuestionnaire } from '@/components/proms/ipss/ipss-questionnaire';
import { IPSSAnswers, IPSSScore } from '@/types/prom';
import { Button } from '@/components/ui/button';
import { useAssessmentDraft } from '@/hooks/use-assessment-draft';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PatientIpssPage() {
  const router = useRouter();
  const [currentAnswers, setCurrentAnswers] = useState<IPSSAnswers | null>(null);
  const [currentScore, setCurrentScore] = useState<IPSSScore | null>(null);

  const { update } = useAssessmentDraft();

  const handleNext = () => {
    if (currentAnswers && currentScore) {
      update({ ipssAnswers: currentAnswers, ipssScore: currentScore });
    }
    router.push('/assessment/shim');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step 1 of 3</span>
          <h1 className="text-2xl font-extrabold text-foreground">Urinary Symptom Questionnaire (IPSS)</h1>
        </div>
        <Link href="/assessment">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Hub</span>
          </Button>
        </Link>
      </div>

      <IPSSQuestionnaire
        onComplete={(answers, score) => {
          setCurrentAnswers(answers);
          setCurrentScore(score);
        }}
      />

      <div className="flex items-center justify-between pt-6 border-t">
        <Link href="/assessment">
          <Button variant="outline">Back</Button>
        </Link>
        <Button onClick={handleNext} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
          <span>Continue to SHIM (Step 2)</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
