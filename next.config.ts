import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double-invoking effects and double-rendering in local development
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'canvas-confetti'],
  },
};

export default nextConfig;

