import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Sans } from "next/font/google";

import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { ROBOTS_INDEX } from "@/lib/seo";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import SwrDefaults from "@/components/providers/SwrDefaults";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import { consentBootstrapScript } from "@/lib/consent";
import GlobalSeo from "@/components/seo/GlobalSeo";
import ConsentAwareAnalytics from "@/components/analytics/ConsentAwareAnalytics";
import AdSenseScript from "@/components/ads/AdSenseScript";
import { Toaster } from "react-hot-toast";
import RewardFeed from "@/components/ui/RewardFeed";

// Instrument Sans, replacing Archivo.
//
// Archivo was not too strong by itself — it was set at maximum on four counts
// at once: Black 900, SemiCondensed 87.5%, uppercase, and letter-spaced.
// Counted across the site: 995 places use the display face, 529 of them at
// font-black, 628 uppercase, 641 letter-spaced. Instrument Sans is quieter by
// nature and its weight tops out at 700, so globals.css remaps the utilities
// rather than letting the browser synthesise a Black that does not exist.
//
// The wdth axis is loaded because the layout was built around a condensed
// face; globals.css pins a milder cut than Archivo's.
const instrument = Instrument_Sans({
  variable: "--font-display-src",
  subsets: ["latin", "latin-ext"],
  display: 'swap',
  preload: true,
  axes: ["wdth"],
});

// Inter is an excellent typeface and the most-used one on the web, which is the
// problem: paired with Archivo — another neutral grotesque — the two did not
// read as a pair, they read as one font at two widths. Plex has a drawn,
// slightly engineered hand (the cut terminals on a, l, t) that belongs on a
// site about hardware and games, and it holds up at 13px on a dark ground.
const plexSans = IBM_Plex_Sans({
  variable: "--font-body-src",
  subsets: ["latin", "latin-ext"],
  display: 'swap',
  preload: true,
});

// Digits only. The site is full of numbers that are the content rather than
// decoration — review scores, XP, bounty, leaderboard positions, counters — and
// a proportional face makes a column of them wander. Plex Mono is the same
// family's monospace, so it sits beside the body text instead of arguing.
//
// One weight, latin only: digits are ASCII, and Plex Mono has no variable cut,
// so every extra weight is another file.
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["600"],
  display: 'swap',
  /*
   * Not preloaded, unlike the other two.
   *
   * Three families with two subsets each put five font files — 152 KB — in
   * front of the LCP image, and on Slow 4G that queue is most of why the
   * homepage takes eleven seconds to show its picture. This face sets scores,
   * counters and timestamps: numbers that are already legible in the fallback
   * and that nobody reads before the headline. It still loads, one step later,
   * and `swap` means the digits appear immediately either way.
   *
   * The display and body faces stay preloaded — they draw the first text on
   * screen, and a headline that reflows after paint is worse than a counter
   * that does.
   */
  preload: false,
});


async function getSiteSettings() {
  try {
    const res = await fetch(`${getServerApiUrl()}/settings`, {
            headers: serverHeaders(),
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return {};
    return res.json();
  } catch (error) {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.site_name || "TechPlay";
  const separator = settings.seo_title_separator || "|";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg'),
    title: {
      default: siteName,
      template: `%s ${separator} ${siteName}`,
    },
    description: settings.seo_meta_description || "TechPlay puts every game you own in one library — Steam, PlayStation and Xbox together, with the hours you played — then reads your taste back to you. Plus reviews, release dates and the game catalogue.",
    keywords: ["gaming", "gaming news", "hardware reviews", "PC gaming", "esports", "game database", "TechPlay"],
    openGraph: {
      type: 'website',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg',
      siteName: siteName,
      images: settings.seo_og_image_default ? [{ url: `${process.env.NEXT_PUBLIC_STORAGE_URL}/${settings.seo_og_image_default}` }] : [],
    },
    twitter: {
      card: settings.seo_twitter_card_type || 'summary_large_image',
      site: settings.seo_social_twitter,
    },
    // Global default: allow indexing, and allow the large image preview that
    // Google Discover requires. Individual pages override with their own
    // noindex; the directives themselves live in lib/seo.ts so the six files
    // that emit a robots block cannot drift apart again.
    robots: ROBOTS_INDEX,
    verification: {
      google: settings.seo_google_verification,
      yandex: settings.seo_yandex_verification,
      yahoo: settings.seo_bing_verification, // Bing often used for Yahoo too
      other: {
        'msvalidate.01': settings.seo_bing_verification,
        'baidu-site-verification': settings.seo_baidu_verification,
      },
    },
    alternates: {
      types: {
        'application/rss+xml': [{ url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg'}/rss`, title: 'TechPlay RSS Feed' }],
      },
    },
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
  };
}

// MOBILE: Explicit viewport configuration for better mobile experience
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Matches manifest.json's theme_color. It was a navy that belonged to
  // neither the brand nor the manifest — the two now agree.
  themeColor: '#DC143C',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings server-side to render Organization/WebSite schema in initial HTML.
  // Uses Next.js fetch cache (revalidate: 3600) — no extra network cost.
  const settings = await getSiteSettings();
  const siteName = settings.site_name || 'TechPlay';
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg').replace(/\/$/, '');
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://api-beta.techplay.gg/storage';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': settings.seo_organization_type || 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: settings.seo_organization_name || siteName,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: settings.seo_organization_logo
        ? `${storageUrl}/${settings.seo_organization_logo}`
        : `${siteUrl}/icon-512.png`,
    },
    sameAs: [
      settings.seo_social_facebook,
      settings.seo_social_twitter
        ? `https://twitter.com/${settings.seo_social_twitter.replace('@', '')}`
        : null,
      settings.seo_social_instagram,
      settings.youtube_url,
      settings.discord_url,
    ].filter(Boolean),
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: siteName,
    url: siteUrl,
    publisher: { '@id': `${siteUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className={`${instrument.variable} ${plexSans.variable} ${plexMono.variable} dark`} suppressHydrationWarning>
      <head>
        {/* Organization + WebSite JSON-LD — server-rendered so SEO crawlers see it in raw HTML */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

        {/* Preconnect to production API — used for client-side data fetching on interactive pages */}
        {/*
          * The only preconnect on the page used to point at api.techplay.gg,
          * which does not resolve — nslookup returns NXDOMAIN. So the most
          * expensive hint a page can give (DNS + TCP + TLS, spent up front)
          * was spent on a lookup that can only time out, while the host that
          * actually serves the site got the weakest hint instead.
          *
          * The browser does reach api-beta directly: the client axios baseURL
          * is NEXT_PUBLIC_API_URL, and the homepage alone references 86 images
          * on its /storage path. The comment that used to sit here claimed the
          * opposite.
          */}
        <link rel="preconnect" href="https://api-beta.techplay.gg" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api-beta.techplay.gg" />

        {/* Google Analytics — dns-prefetch only, preconnect not needed (afterInteractive) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Google AdSense */}
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        {/*
            Hide the cookie banner before hydration for people who have already
            answered it — runs sync, so they never see it flash past.

            It marks the <html> element rather than appending a <style> to the
            head, which is what it used to do. The rule itself lives in
            globals.css. The difference matters: this script runs while the
            document is still parsing, before React hydrates, so anything it
            adds to the head is a node React never rendered and cannot account
            for — and a mismatch at that level makes React throw the whole
            server-rendered tree away and redraw from scratch, which reads as
            the screen darkening for a moment. Marking <html> is free of that,
            because <html> already carries suppressHydrationWarning below.
        */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('cookie_preferences')){document.documentElement.classList.add('cookie-choice-made');}}catch(e){}})();` }} />

        {/*
            Turn smooth scrolling off while the browser is restoring a position.

            `html { scroll-behavior: smooth }` in globals.css is there for anchor
            links, and it also applies to the scroll the browser performs when
            you press Back — so instead of the page reappearing where you left
            it, it lands at the top and glides down to your old position.
            Measured on the live site: after Back from an article to a listing
            the reader had scrolled 2500px into, scrollY walked 0 → 456 → 1808 →
            2234 → 2500 over about 900ms. Nearly a second of the page racing past
            under the cursor, which on a near-black theme reads as the screen
            going dark — and it throws no error, which is why it outlived every
            console-level search for it.

            The listener only covers history navigation and puts the smooth
            behaviour straight back, so links to an id still glide.
        */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var d=document.documentElement,t;addEventListener('popstate',function(){d.style.scrollBehavior='auto';clearTimeout(t);t=setTimeout(function(){d.style.scrollBehavior='';},400);});})();` }} />

        {/* dataLayer, Consent Mode defaults, and the reader's saved answer.

            This said `analytics_storage: 'granted'` while the config below said
            `client_storage: 'none'` — so it claimed consent it then made
            impossible to act on. The banner had been collecting a real choice
            the whole time and telling only the ad slots about it.

            Denied by default now, and the stored answer applied in the same
            breath, before gtag.js runs. A reader who consented last week would
            otherwise lose the first page view of every visit — the one that
            decides which landing page gets the credit. */}
        <script dangerouslySetInnerHTML={{ __html: consentBootstrapScript() }} />

        {/* GA4 itself, in the head rather than after hydration.

            It used to mount through next/script with `afterInteractive`, which
            waits for React to hydrate before it executes. On 1 September GA
            counted 124 people against 198 real browsers the server saw, and of
            127 visitors arriving from a paid ad it recorded 52. The missing
            ones are not a mystery: 43 of 84 ad visitors that day left inside
            ten seconds, and on a phone over mobile data hydration has not
            finished by then. The people most worth measuring — the ones who
            bounce — were the only ones never measured.

            This costs almost nothing. next/script was already emitting
            `<link rel="preload" as="script">` for the same URL, so the download
            was always starting early; only execution waited. `async` keeps it
            off the parser's critical path, and the queue above means the
            page_view is already waiting for the library the moment it lands.

            `client_storage: 'none'` stays. It is why no consent banner is
            needed, and it is also why GA cannot tell a returning reader from a
            new one — the "5s average engagement" is that, not real behaviour.
            Changing it is a separate decision with a GDPR bill attached.

            `transport_url` is the other half of the same problem. The library
            was already served from our own domain, which is why it loads — but
            it still posted its measurements to google-analytics.com, which
            every serious content blocker refuses. So the tag ran and the data
            never left: 52 of 127 visitors from a paid ad were counted, and a
            member who registered from Serbia did not appear at all while his
            browser had demonstrably fetched the script a minute earlier.

            app/proxy/ga has relayed those hits since before any of this, and
            nothing had ever pointed at it. Now the beacon is first-party too,
            and there is nothing left on a blocklist for a blocker to match.

            `location.origin` rather than a baked-in techplay.gg: the help
            centre is served from a second hostname over the same application,
            and an absolute URL would make every beacon from there a
            cross-origin POST the relay answers with no CORS headers — so
            analytics would be silently dead on that whole subdomain. Each host
            now relays through itself. */}
        <script
          dangerouslySetInnerHTML={{ __html: `
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'G-0J974Y0X23'}', {
            send_page_view: true,
            transport_url: location.origin + '/proxy/ga'
          });
        `}}
        />
        <script async src={`/proxy/gtag?id=${process.env.NEXT_PUBLIC_GA_ID || 'G-0J974Y0X23'}`} />

        {/* AdSense script moved to body via Script component (afterInteractive) */}
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>

        {/* Analytics loaded conditionally based on user cookie consent */}
        <ConsentAwareAnalytics />

        {/* AdSense — afterInteractive, and only on techplay.gg itself. It used
            to load unconditionally, so a local dev session or the origin opened
            by its bare IP billed real impressions to the account; AdSense was
            reporting `127.0.0.1` and `46.224.110.57` as sites. The host can
            only be read in the browser, hence the client component. */}
        <AdSenseScript />

        <SwrDefaults>
        <SiteSettingsProvider initialSettings={settings}>
            <MobileMenuProvider>
              <CartProvider>
                <AuthProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                  <CookieConsentBanner />

                  <GlobalSeo />
                  <Toaster position="bottom-right" containerClassName="tp-toasts" />
                  {/* What the last action earned — small numbers in the
                      corner, and the middle of the screen for the rare
                      things worth stopping for. */}
                  <RewardFeed />
                </AuthProvider>
              </CartProvider>
            </MobileMenuProvider>
        </SiteSettingsProvider>
        </SwrDefaults>
      </body>
    </html>
  );
}
