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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/30 bg-primary/10/60 dark:border-teal-900 dark:bg-teal-950/30">
        <div>
          <h3 className="text-sm font-bold text-teal-950 dark:text-teal-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            International Prostate Symptom Score (IPSS)
          </h3>
          <p className="text-xs text-primary/80 dark:text-teal-400 mt-0.5">
            Urinary function assessment (Past 1 month)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Total Score:</span>
            <span className="text-xl font-extrabold text-primary dark:text-teal-100 font-mono">
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
            <Card key={q.key} className="border-border dark:border-slate-800 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground dark:text-white">
                  {q.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">{q.question}</p>
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
                            ? 'border-primary bg-primary text-white font-bold shadow-sm ring-2 ring-ring/30'
                            : 'border-border bg-muted/60 text-foreground hover:bg-muted hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
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
        <Card className="border-info/20 bg-info-muted/30 dark:border-cyan-900 dark:bg-cyan-950/10 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-info-muted-foreground dark:text-cyan-200">
              8. Quality of Life Due to Urinary Symptoms (Bother Score)
            </CardTitle>
            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
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
                        ? 'border-cyan-600 bg-info text-white font-bold shadow-sm ring-2 ring-cyan-600/30'
                        : 'border-border bg-card text-foreground hover:bg-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
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
  if (!score) return <span className="text-muted-foreground italic">No IPSS recorded</span>;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-bold text-foreground dark:text-slate-100">{score.totalScore}/35</span>
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
