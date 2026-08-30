import type { NextConfig } from "next";

// Content-Security-Policy tuned for this app's real dependencies: Supabase over
// HTTPS + realtime WebSocket, and Google Fonts. `frame-ancestors 'none'` is the
// modern equivalent of X-Frame-Options; `object-src 'none'` and `base-uri 'self'`
// close common injection vectors.
//
// `script-src` keeps 'unsafe-inline'/'unsafe-eval' because Next.js App Router
// emits inline hydration scripts and this app does not yet run the nonce
// middleware a strict script policy needs. That is the one remaining loosening —
// tightening it to a per-request nonce is the tracked follow-up. Everything else
// is already locked to 'self' plus the two hosts the app genuinely calls.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// Security headers applied to every response. A clinical app handling patient
// records should ship these by default: force HTTPS, forbid framing (clickjacking),
// stop MIME sniffing, and keep referrers and browser features tightly scoped.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
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

