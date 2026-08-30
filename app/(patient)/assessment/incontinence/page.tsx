'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContinenceSelector } from '@/components/proms/continence/continence-selector';
import { ContinenceData } from '@/types/prom';
import { Button } from '@/components/ui/button';
import { useAssessmentDraft } from '@/hooks/use-assessment-draft';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PatientIncontinencePage() {
  const router = useRouter();
  const [data, setData] = useState<ContinenceData | null>(null);

  const { update } = useAssessmentDraft();

  const handleNext = () => {
    if (data) update({ continence: data });
    router.push('/assessment/review');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Step 3 of 3</span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Pad Usage & Continence Assessment</h1>
        </div>
        <Link href="/assessment/shim">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
        </Link>
      </div>

      <ContinenceSelector onChange={setData} />

      <div className="flex items-center justify-between pt-6 border-t">
        <Link href="/assessment/shim">
          <Button variant="outline">Back to SHIM</Button>
        </Link>
        <Button onClick={handleNext} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <span>Review & Submit</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
