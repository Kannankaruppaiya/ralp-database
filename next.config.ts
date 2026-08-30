import type { NextConfig } from "next";

// Baseline hardening for an app that serves patient PII. A Content-Security-Policy
// is intentionally left out here: a correct one for Next.js needs per-request
// nonces and must be validated against the running app, so it belongs in
// middleware rather than a static allow-all that would give false assurance.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double-invoking effects and double-rendering in local development
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'canvas-confetti'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;

