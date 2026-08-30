import type { NextConfig } from "next";

// Security headers applied to every response. A clinical app handling patient
// records should ship these by default: force HTTPS, forbid framing (clickjacking),
// stop MIME sniffing, and keep referrers and browser features tightly scoped.
const securityHeaders = [
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

