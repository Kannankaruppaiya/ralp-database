'use client';

import React, { useState, useMemo } from 'react';
import { IPSSAnswers, IPSSScore } from '@/types/prom';
import { IPSS_QUESTIONS, IPSS_QOL_OPTIONS, calculateIpssScore } from '@/features/proms/ipss/scoring';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle2 } from 'lucide-react';

interface IPSSQuestionnaireProps {
  initialAnswers?: Partial<IPSSAnswers>;
  onComplete?: (answers: IPSSAnswers, score: IPSSScore) => void;
  isReadOnly?: boolean;
}

export function IPSSQuestionnaire({ initialAnswers, onComplete, isReadOnly = false }: IPSSQuestionnaireProps) {
  const [answers, setAnswers] = useState<IPSSAnswers>({
    incompleteEmptying: initialAnswers?.incompleteEmptying ?? 0,
    frequency: initialAnswers?.frequency ?? 0,
    intermittency: initialAnswers?.intermittency ?? 0,
    urgency: initialAnswers?.urgency ?? 0,
    weakStream: initialAnswers?.weakStream ?? 0,
    straining: initialAnswers?.straining ?? 0,
    nocturia: initialAnswers?.nocturia ?? 0,
    qualityOfLife: initialAnswers?.qualityOfLife ?? 1,
  });

  const score = useMemo(() => calculateIpssScore(answers), [answers]);

  const handleSelect = (key: keyof IPSSAnswers, val: number) => {
    if (isReadOnly) return;
    const updated = { ...answers, [key]: val };
    setAnswers(updated);
    onComplete?.(updated, calculateIpssScore(updated));
  };

  return (
    <div className="space-y-6">
      {/* Live Scoring Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30">
        <div>
          <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            International Prostate Symptom Score (IPSS)
          </h3>
          <p className="text-xs text-blue-800/80 dark:text-blue-400 mt-0.5">
            Urinary function assessment (Past 1 month)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Score:</span>
            <span className="text-xl font-extrabold text-blue-900 dark:text-blue-100 font-mono">
              {score.totalScore} / 35
            </span>
          </div>
          <Badge
            variant={score.severity === 'Mild' ? 'success' : score.severity === 'Moderate' ? 'warning' : 'destructive'}
            className="px-3 py-1 text-xs"
          >
            {score.severity} Symptoms
          </Badge>
        </div>
      </div>

      {/* 7 Questions */}
      <div className="space-y-4">
        {IPSS_QUESTIONS.map((q, idx) => {
          const currentVal = answers[q.key as keyof IPSSAnswers];
          return (
            <Card key={q.key} className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                  {q.title}
                </CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{q.question}</p>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {q.options.map((opt) => {
                    const isSelected = currentVal === opt.score;
                    return (
                      <button
                        key={opt.score}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => handleSelect(q.key as keyof IPSSAnswers, opt.score)}
                        className={cn(
                          'flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all',
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-sm ring-2 ring-blue-600/30'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        )}
                      >
                        <span className="text-xs leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Question 8: Quality of life */}
        <Card className="border-sky-200 bg-sky-50/30 dark:border-sky-900 dark:bg-sky-950/10 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-sky-950 dark:text-sky-200">
              8. Quality of Life Due to Urinary Symptoms (Bother Score)
            </CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              If you were to spend the rest of your life with your prostate symptoms just the way they are now, how would you feel?
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {IPSS_QOL_OPTIONS.map((opt) => {
                const isSelected = answers.qualityOfLife === opt.score;
                return (
                  <button
                    key={opt.score}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleSelect('qualityOfLife', opt.score)}
                    className={cn(
                      'flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all',
                      isSelected
                        ? 'border-sky-600 bg-sky-600 text-white font-bold shadow-sm ring-2 ring-sky-600/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    )}
                  >
                    <span className="text-xs leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function IPSSScoreCard({ score }: { score?: IPSSScore }) {
  if (!score) return <span className="text-slate-400 italic">No IPSS recorded</span>;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{score.totalScore}/35</span>
      <Badge
        variant={score.severity === 'Mild' ? 'success' : score.severity === 'Moderate' ? 'warning' : 'destructive'}
        className="text-[10px]"
      >
        {score.severity}
      </Badge>
    </div>
  );
}

export function IPSSHistory() {
  return null;
}
