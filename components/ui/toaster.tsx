'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.variant === 'success';
        const isDestructive = t.variant === 'destructive';
        const isComingSoon = t.title.toLowerCase().includes('coming soon') || (t.description && t.description.toLowerCase().includes('coming soon'));

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all animate-in slide-in-from-top-3 fade-in duration-200 ${
              isDestructive
                ? 'bg-rose-950/95 border-rose-800/80 text-rose-100 backdrop-blur-md'
                : isSuccess
                ? 'bg-emerald-950/95 border-emerald-800/80 text-emerald-100 backdrop-blur-md'
                : isComingSoon
                ? 'bg-slate-950/95 border-purple-500/40 text-slate-100 backdrop-blur-md shadow-purple-500/10'
                : 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-md'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isDestructive ? (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              ) : isSuccess ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : isComingSoon ? (
                <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
              ) : (
                <Info className="h-5 w-5 text-teal-400" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="text-xs font-bold leading-tight flex items-center gap-2">
                <span>{t.title}</span>
                {isComingSoon && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono uppercase">
                    Preview
                  </span>
                )}
              </div>
              {t.description && (
                <p className="text-[11px] text-slate-300 leading-snug">
                  {t.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded-lg hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
