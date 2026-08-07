import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Bundle analyzer - run with: $env:ANALYZE="true"; npm run build
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
    // Debug logging is for development; production keeps only errors.
    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },

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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js hydration + JSON-LD dangerouslySetInnerHTML require unsafe-inline
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.facebook.com https://accounts.google.com https://wow.zamimg.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://adservice.google.com https://challenges.cloudflare.com https://*.adtrafficquality.google https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              // Permissive img-src to allow all CDNs (avatars, banners, game covers, ads)
              "img-src * data: blob:",
              `connect-src 'self' https://api-beta.techplay.gg https://api.techplay.gg wss://api-beta.techplay.gg:8080 wss://api.techplay.gg:8080 http://backend.test https://backend.test http://127.0.0.1:8001 http://127.0.0.1:8000 https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.facebook.com https://connect.facebook.net https://wow.zamimg.com https://accounts.google.com https://*.adtrafficquality.google https://www.google.com https://pagead2.googlesyndication.com https://38wzs9wt1a.execute-api.eu-central-1.amazonaws.com https://streaming-media.production.privee.world https://static-media.production.privee.world`,
              // iframes: YouTube, Twitter/X, Instagram, Facebook, Google Ads, Google Sign-In
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://twitter.com https://x.com https://platform.twitter.com https://www.instagram.com https://www.facebook.com https://accounts.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://www.google.com https://*.adtrafficquality.google https://challenges.cloudflare.com",
              "media-src 'self' blob: https://api-beta.techplay.gg https://streaming-media.production.privee.world https://static-media.production.privee.world",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
            ].join('; ')
          },
          {
            key: 'Link',
            value: '<https://api-beta.techplay.gg>; rel=preconnect; crossorigin'
          },
        ],
      },
    ];
  },

  // Performance: Enable compression
  compress: true,

  // Performance: Optimize packages and CSS
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image',
      'hls.js',
    ],
    // Enable CSS optimization - inlines critical CSS
    optimizeCss: true,
    // Parallelize webpack builds
    webpackBuildWorker: true,
  },

  // Images: disable server-side processing for external CDN images.
  // media.rawg.io is already a CDN — Next.js optimization creates millions of cached
  // variants on disk (16+ per image × 900k games = disk exhaustion).
  // <Image> component still provides lazy loading and CLS prevention without caching.
  images: {
    unoptimized: true,

    // Next.js 16 requires every quality value used by <Image quality={...}> to be declared
    qualities: [60, 70, 75, 80, 90],

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
        protocol: 'http',
        hostname: 'backend.test',
      },
      {
        protocol: 'https',
        hostname: 'backend.test',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
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
        hostname: 'api.techplay.gg',
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

  async rewrites() {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api-beta.techplay.gg/api/v1').replace(/\/api\/v1\/?$/, '');
    return [
      { source: '/feed', destination: `${backendBase}/feed` },
      { source: '/rss',  destination: `${backendBase}/feed` },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
