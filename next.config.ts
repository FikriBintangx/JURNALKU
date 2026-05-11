import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.semanticscholar.org',
      },
    ],
  },
  // Ensure react-pdf works smoothly
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
