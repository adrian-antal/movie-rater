import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for deployment platforms
  images: {
    unoptimized: process.env.NODE_ENV === 'development' ? false : true, // Disable optimization for static exports/deployments
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },

  // Enable SSR features
  serverExternalPackages: [],

  // Netlify-specific optimizations
  trailingSlash: false,
  poweredByHeader: false,
  
  // Don't force static export - allow SSR
  output: undefined,
};

export default nextConfig;
