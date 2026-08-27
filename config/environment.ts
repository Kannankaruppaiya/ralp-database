export type AppTier = 'development' | 'staging' | 'production';

const tier = (process.env.NEXT_PUBLIC_APP_ENV as AppTier) || 'development';

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Surgical Outcomes Database',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
  description: 'RALP Database v2 - Advanced Prostate Cancer Surgical Outcomes & PROMs Platform',
  tier,
  isProduction: tier === 'production',
  /** Non-production tiers carry synthetic data and show a banner saying so. */
  showEnvBanner: tier !== 'production',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
};

/**
 * Fails the build rather than shipping a clinical app pointed at nothing.
 * Runs on import in both the browser and server bundles.
 */
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const message =
    `[${tier}] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ` +
    `Copy .env.${tier}.example to .env.${tier} and fill it in.`;
  if (tier === 'production') throw new Error(message);
  console.warn(message);
}
