import { APP_CONFIG } from '@/config/environment';
import { AlertCircle, FlaskConical } from 'lucide-react';

/**
 * Marks non-production deployments.
 *
 * Development and staging hold synthetic patients. Without a visible marker,
 * the three environments are indistinguishable on screen, and a clinician
 * could read test data as though it were a real record — or enter a real one
 * into a database that gets wiped.
 */
export function EnvBanner() {
  if (!APP_CONFIG.showEnvBanner) return null;

  const isStaging = APP_CONFIG.tier === 'staging';

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 px-3 py-1 bg-slate-950/95 border-b border-slate-800 text-[11px] text-slate-300 backdrop-blur-md"
    >
      <div className="flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
        <FlaskConical className="h-3 w-3 text-teal-400" />
        <span>{APP_CONFIG.tier}</span>
      </div>
      <span className="font-medium text-slate-400 text-xs">
        Synthetic Oxford cohort data — not a live clinical EPR record
      </span>
    </div>
  );
}

