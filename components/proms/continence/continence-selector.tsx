'use client';

import React, { useState } from 'react';
import { ContinenceData, IncontinenceDayStatus, IncontinenceNightPads } from '@/types/prom';
import { INCONTINENCE_DAY_OPTIONS, INCONTINENCE_NIGHT_OPTIONS } from '@/config/clinical-options';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContinenceSelectorProps {
  initialData?: Partial<ContinenceData>;
  onChange?: (data: ContinenceData) => void;
  isReadOnly?: boolean;
}

export function ContinenceSelector({ initialData, onChange, isReadOnly = false }: ContinenceSelectorProps) {
  const [data, setData] = useState<ContinenceData>({
    dayStatus: initialData?.dayStatus || 'Completely dry, no pad',
    nightPads: initialData?.nightPads ?? 0,
    padSize: initialData?.padSize || 'Security shield / liner',
  });

  const handleDaySelect = (status: IncontinenceDayStatus) => {
    if (isReadOnly) return;
    const updated = { ...data, dayStatus: status };
    setData(updated);
    onChange?.(updated);
  };

  const handleNightSelect = (pads: IncontinenceNightPads) => {
    if (isReadOnly) return;
    const updated = { ...data, nightPads: pads };
    setData(updated);
    onChange?.(updated);
  };

  const isContinent = data.dayStatus === 'Completely dry, no pad' && data.nightPads === 0;

  return (
    <div className="space-y-6">
      {/* Continence Status Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30">
        <div>
          <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
            <Droplet className="h-4 w-4 text-blue-600" />
            Continence & Pad Usage Assessment
          </h3>
          <p className="text-xs text-blue-800/80 dark:text-blue-400 mt-0.5">
            24-hour urinary continence recovery monitoring
          </p>
        </div>
        <Badge variant={isContinent ? 'success' : 'warning'} className="px-3 py-1 text-xs">
          {isContinent ? 'Continent (Pad-Free)' : 'Using Pads / Leakage'}
        </Badge>
      </div>

      {/* Daytime Incontinence Options */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
            Daytime Pad Usage & Leakage Frequency
          </CardTitle>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Select the option that best reflects your typical daytime bladder control:
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {INCONTINENCE_DAY_OPTIONS.map((opt) => {
              const isSelected = data.dayStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleDaySelect(opt.value)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white font-semibold shadow-sm ring-2 ring-blue-600/30'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  )}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Nighttime Pads */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
            Nighttime Pads Required
          </CardTitle>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Number of pads needed overnight while sleeping:
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {INCONTINENCE_NIGHT_OPTIONS.map((opt) => {
              const isSelected = data.nightPads === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleNightSelect(opt.value)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white font-semibold shadow-sm ring-2 ring-blue-600/30'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  )}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContinenceHistory() {
  return null;
}
