import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig: NextConfig = {
  output: 'standalone', // Self-contained server bundle — what gets shipped to the EC2 host
  // A stray lockfile in the home directory makes Next infer the wrong workspace
  // root, which nests the standalone build under Documents/Vivek/.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  reactStrictMode: false, // Prevents double-invoking effects and double-rendering in local development
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'canvas-confetti'],
  },
};

export default nextConfig;

