import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },

  // Performance: Enable compression
  compress: true,

  // Performance: Optimize packages
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },

  // Keep existing image config with performance enhancements
  images: {
    // Prefer modern image formats for better compression
    formats: ['image/avif', 'image/webp'],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimize layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
      },
      {
        protocol: 'https',
        hostname: 'api-beta.techplay.gg',
      },
      {
        protocol: 'https',
        hostname: 'streaming-media.production.privee.world',
      },
      {
        protocol: 'https',
        hostname: 'static-media.production.privee.world',
      },
    ],
  },
};

export default nextConfig;
