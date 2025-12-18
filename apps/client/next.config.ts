import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@serp/trpc', '@serp/validations'],
  output: 'standalone',
};

export default nextConfig;
