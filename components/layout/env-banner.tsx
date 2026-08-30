import { APP_CONFIG } from '@/config/environment';

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
      className={`sticky top-0 z-[60] flex items-center justify-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ${
        isStaging ? 'bg-warning' : 'bg-indigo-600'
      }`}
    >
      <span>{APP_CONFIG.tier} environment</span>
      <span className="font-medium normal-case tracking-normal opacity-90">
        — synthetic data only, not a clinical record
      </span>
    </div>
  );
}
