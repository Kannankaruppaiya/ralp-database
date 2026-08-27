'use client';

import React, { useState, useMemo } from 'react';
import { SHIMAnswers, SHIMScore } from '@/types/prom';
import { SHIM_QUESTIONS, calculateShimScore } from '@/features/proms/shim/scoring';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface SHIMQuestionnaireProps {
  initialAnswers?: Partial<SHIMAnswers>;
  onComplete?: (answers: SHIMAnswers, score: SHIMScore) => void;
  isReadOnly?: boolean;
}

export function SHIMQuestionnaire({ initialAnswers, onComplete, isReadOnly = false }: SHIMQuestionnaireProps) {
  const [answers, setAnswers] = useState<SHIMAnswers>({
    confidence: initialAnswers?.confidence ?? 3,
    firmness: initialAnswers?.firmness ?? 3,
    maintenanceFrequency: initialAnswers?.maintenanceFrequency ?? 3,
    maintenanceDifficulty: initialAnswers?.maintenanceDifficulty ?? 3,
    satisfaction: initialAnswers?.satisfaction ?? 3,
  });

  const score = useMemo(() => calculateShimScore(answers), [answers]);

  const handleSelect = (key: keyof SHIMAnswers, val: number) => {
    if (isReadOnly) return;
    const updated = { ...answers, [key]: val };
    setAnswers(updated);
    onComplete?.(updated, calculateShimScore(updated));
  };

  return (
    <div className="space-y-6">
      {/* Live Scoring Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/30">
        <div>
          <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Sexual Health Inventory for Men (SHIM / IIEF-5)
          </h3>
          <p className="text-xs text-purple-800/80 dark:text-purple-400 mt-0.5">
            Erectile function & potency recovery score (Past 6 months)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Score:</span>
            <span className="text-xl font-extrabold text-purple-900 dark:text-purple-100 font-mono">
              {score.totalScore} / 25
            </span>
          </div>
          <Badge
            variant={
              score.severity === 'No ED'
                ? 'success'
                : score.severity === 'Mild ED'
                ? 'info'
                : score.severity === 'Mild to Moderate ED'
                ? 'warning'
                : 'destructive'
            }
            className="px-3 py-1 text-xs"
          >
            {score.severity}
          </Badge>
        </div>
      </div>

      {/* 5 Questions */}
      <div className="space-y-4">
        {SHIM_QUESTIONS.map((q) => {
          const currentVal = answers[q.key as keyof SHIMAnswers];
          return (
            <Card key={q.key} className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                  {q.title}
                </CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{q.question}</p>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {q.options.map((opt) => {
                    const isSelected = currentVal === opt.score;
                    return (
                      <button
                        key={opt.score}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => handleSelect(q.key as keyof SHIMAnswers, opt.score)}
                        className={cn(
                          'flex items-center p-3 rounded-lg border text-left transition-all',
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-sm ring-2 ring-purple-600/30'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        )}
                      >
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function SHIMScoreCard({ score }: { score?: SHIMScore }) {
  if (!score) return <span className="text-slate-400 italic">No SHIM recorded</span>;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{score.totalScore}/25</span>
      <Badge
        variant={score.severity === 'No ED' ? 'success' : score.severity === 'Mild ED' ? 'info' : 'warning'}
        className="text-[10px]"
      >
        {score.severity}
      </Badge>
    </div>
  );
}

export function SHIMHistory() {
  return null;
}
