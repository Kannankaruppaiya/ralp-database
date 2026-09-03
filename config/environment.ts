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
};

// The database connection (DATABASE_URL) is a server-only secret validated where
// the pool is created; it is never referenced from this browser-safe config.
