import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Sora, Inter } from "next/font/google";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"], // Sora max weight is 800 (font-black renders as 800)
  display: 'swap',
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});
import { getServerApiUrl } from "@/lib/api";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import GlobalSeo from "@/components/seo/GlobalSeo";
import ConsentAwareAnalytics from "@/components/analytics/ConsentAwareAnalytics";
import { Toaster } from "react-hot-toast";


async function getSiteSettings() {
  try {
    const res = await fetch(`${getServerApiUrl()}/settings`, {
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
    description: settings.seo_meta_description || "Your source for gaming news, reviews, hardware analysis, and community discussions.",
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
    robots: {
      // Global default: allow indexing. Individual pages can override with their own noindex.
      // seo_noindex_search should only apply to /search pages, not globally.
      index: true,
      follow: true,
    },
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
        'application/rss+xml': [{ url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg'}/feed`, title: 'TechPlay RSS Feed' }],
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
  themeColor: '#001540',
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
    <html lang="en" className={`${sora.variable} ${inter.variable} dark`} suppressHydrationWarning>
      <head>
        {/* Organization + WebSite JSON-LD — server-rendered so SEO crawlers see it in raw HTML */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

        {/* Preconnect to production API — used for client-side data fetching on interactive pages */}
        <link rel="preconnect" href="https://api.techplay.gg" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.techplay.gg" />
        {/* dns-prefetch only for beta API (used server-side only, browser never connects directly) */}
        <link rel="dns-prefetch" href="https://api-beta.techplay.gg" />

        {/* Google Analytics — dns-prefetch only, preconnect not needed (afterInteractive) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Google AdSense */}
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        {/* Hide cookie banner before React hydration for returning users — runs sync, no flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('cookie_preferences')){var s=document.createElement('style');s.textContent='#cookie-banner{display:none!important}';document.head.appendChild(s);}}catch(e){}})();` }} />

        {/* dataLayer + Consent Mode: analytics granted (cookieless), ads denied */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
        `}} />

        {/* AdSense script moved to body via Script component (afterInteractive) */}
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>

        {/* Analytics loaded conditionally based on user cookie consent */}
        <ConsentAwareAnalytics />

        {/* AdSense Auto Ads — afterInteractive so it runs after React hydration, not during */}
        <Script
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7427807317921666"
            strategy="afterInteractive"
            crossOrigin="anonymous"
        />

        <SiteSettingsProvider>
            <MobileMenuProvider>
              <CartProvider>
                <AuthProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                  <CookieConsentBanner />

                  <GlobalSeo />
                  <Toaster position="bottom-right" />
                </AuthProvider>
              </CartProvider>
            </MobileMenuProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
