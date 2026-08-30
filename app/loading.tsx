import React from 'react';
import { Activity, Shield, Sparkles } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md text-white select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

      {/* Main Spinner Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full mx-4 p-8 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-2xl backdrop-blur-xl text-center">
        {/* Animated Rings & Icon */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 border-r-blue-400 border-b-transparent border-l-transparent animate-spin" />
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Activity className="w-7 h-7 text-white animate-pulse" />
          </div>
        </div>

        {/* Title and Subtitle */}
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span>RALP Outcomes Platform</span>
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          Loading clinical records & encryption keys...
        </p>

        {/* Shimmering Progress Bar */}
        <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-6 overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 rounded-full w-full animate-pulse" />
        </div>

        {/* NHS Security Badge */}
        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700/50">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Caldicott Principle 7 & GDPR Compliant</span>
        </div>
      </div>
    </div>
  );
}
