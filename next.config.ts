import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  webpack: (config) => {
    if (config.resolve) {
      config.resolve.symlinks = false;
    }
    return config;
  },
};

export default nextConfig;
