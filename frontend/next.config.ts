import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Bundle analyzer - run with: $env:ANALYZE="true"; npm run build
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isDev = process.env.NODE_ENV !== 'production';

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
              // 'unsafe-inline' stays: Next's hydration bootstrap and the JSON-LD
              // blocks are inline scripts, and there is no nonce pipeline here.
              //
              // 'unsafe-eval' is development only. React Refresh needs it; a
              // production bundle does not, and leaving it on hands any XSS the
              // ability to build code out of strings. Verified against a real
              // production build — pages, ads and the Turnstile widget included
              // — before it was taken away.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.facebook.com https://accounts.google.com https://wow.zamimg.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://adservice.google.com https://challenges.cloudflare.com https://*.adtrafficquality.google https://static.cloudflareinsights.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://wow.zamimg.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              // Permissive img-src to allow all CDNs (avatars, banners, game covers, ads)
              "img-src * data: blob:",
              `connect-src 'self' https://api-beta.techplay.gg https://api.techplay.gg wss://api-beta.techplay.gg wss://api.techplay.gg wss://api-beta.techplay.gg:8080 wss://api.techplay.gg:8080 http://backend.test https://backend.test http://127.0.0.1:8001 http://127.0.0.1:8000 https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.facebook.com https://connect.facebook.net https://wow.zamimg.com https://accounts.google.com https://*.adtrafficquality.google https://www.google.com https://pagead2.googlesyndication.com https://38wzs9wt1a.execute-api.eu-central-1.amazonaws.com https://streaming-media.production.privee.world https://static-media.production.privee.world`,
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
    // optimizeCss and webpackBuildWorker used to sit here. Both are webpack
    // options, and Next 16 builds with Turbopack — the build even prints
    // webpackBuildWorker back as a step it is not running. So critical CSS was
    // never being inlined, however much the config claimed it.
    //
    // Getting it back would mean building with webpack, which is a large price
    // for one optimisation. The stylesheet is 45 KB brotli, immutable, and
    // cached at the edge; it costs the first visit only.
  },

  // Images: optimisation is OFF by default and opted into per image.
  //
  // Off by default because game covers are an external catalogue of ~187k
  // titles, already WebP on MobyGames' CDN. Running those through the
  // optimiser fills the disk with variants of art somebody else already
  // optimised. That reasoning has not changed.
  //
  // What it also did, though, was drop `srcset` and `sizes` from OUR uploads,
  // which are stored raw and are where the weight actually is. HeroSlider
  // passes sizes="(max-width: 1024px) 100vw, 45vw" and the production HTML
  // carried neither attribute, so a 412px phone downloaded a 1170x658 JPEG.
  //
  // So the switch is inverted: optimisation is on, and everything that is not
  // ours — game covers, Steam icons, Discord avatars — carries `unoptimized`
  // at the call site. Those are small and already served by a CDN.
  //
  // It has to be this way round. Two narrower approaches were tried and both
  // are impossible in Next 16: a custom loader disables the built-in
  // /_next/image endpoint entirely, and `unoptimized: true` in config does the
  // same, so a per-image `unoptimized={false}` has no endpoint to call.
  images: {
    // WebP only. AVIF encodes far slower and these are resized on demand.
    formats: ['image/webp'],

    // A resized variant of an immutable upload never changes.
    minimumCacheTTL: 31536000,

    // Trimmed from the default: nothing here is served at 2K or 4K, and every
    // extra width is another cached file per image.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],

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
      // The hosts production data actually returns, sampled across /home,
      // /news, /reviews, /guides, /leaderboard, /staff, /shop, /giveaways,
      // /rewards, /gta6 and /games. These images carry `unoptimized` at the
      // call site; the patterns are the safety net, because an unlisted host
      // does not degrade — it throws and takes the section with it.
      {
        // Where game covers come from since the catalogue rebuild.
        protocol: 'https',
        hostname: 'cdn.mobygames.com',
      },
      {
        protocol: 'https',
        hostname: 'shared.akamai.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.steamstatic.com',
      },
      {
        // Discord avatars arrive as absolute URLs and pass straight through
        // getAvatarSrc().
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: '**.gravatar.com',
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

  /**
   * Editor-managed redirects, applied.
   *
   * There are 21 of them in the admin and they have never done anything: the
   * endpoint that serves them says it is "for caching in frontend middleware"
   * and no middleware was ever built — the file that used to exist was
   * removed with maintenance mode. Verified live before wiring this: an old
   * slug answered 200 instead of 301, which is duplicate content on a site
   * whose whole point is search reach.
   *
   * Read at build rather than per request, so there is no runtime cost and no
   * middleware to reintroduce. The trade is that a redirect added in the admin
   * takes effect on the next deploy, not immediately.
   */
  async redirects() {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api-beta.techplay.gg/api/v1').replace(/\/$/, '');
    try {
      const res = await fetch(`${backendBase}/redirects`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const rows: Array<{ source_url?: string; target_url?: string; status_code?: number }> = await res.json();

      const seen = new Set<string>();
      return rows.flatMap((r) => {
        const source = (r.source_url || '').trim();
        const destination = (r.target_url || '').trim();
        // Next throws on a duplicate source, and a rule pointing at itself is
        // a redirect loop the moment it is applied.
        if (!source.startsWith('/') || !destination || source === destination) return [];
        if (seen.has(source)) return [];
        seen.add(source);
        // The editor picks 301 or 302 in the admin; `permanent: true` would
        // silently turn every one of them into a 308.
        return [{ source, destination, statusCode: r.status_code || 301 }];
      });
    } catch {
      // A build must not fail because the API was briefly unreachable.
      return [];
    }
  },

  async rewrites() {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api-beta.techplay.gg/api/v1').replace(/\/api\/v1\/?$/, '');
    return [
      { source: '/feed', destination: `${backendBase}/feed` },
      { source: '/rss',  destination: `${backendBase}/feed` },

      // IndexNow's ownership proof. The protocol wants the key file on the
      // same host as the URLs being submitted, and the URLs are ours while
      // the key lives in the backend's settings — so the frontend serves it
      // by proxy rather than by keeping a second copy that can drift.
      //
      // Scoped to the key's own shape (tp + hex) so this cannot shadow
      // robots.txt, sitemap.xml or anything else ending in .txt.
      {
        source: '/:key(tp[a-f0-9]{24,48}).txt',
        destination: `${backendBase}/:key.txt`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
