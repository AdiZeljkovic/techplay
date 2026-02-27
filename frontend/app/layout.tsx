import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import GlobalSeo from "@/components/seo/GlobalSeo";
import { Toaster } from "react-hot-toast";


const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-main",
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Reduced from 5 to 3 essential weights for faster loading
  display: 'swap',
  preload: true,
  adjustFontFallback: true, // Adjusts fallback font metrics to match web font, reducing CLS
});

async function getSiteSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
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
    keywords: ["gaming", "tech", "reviews", "hardware", "esports", "PC gaming"],
    openGraph: {
      type: 'website',
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
        'application/rss+xml': [{ url: `${process.env.NEXT_PUBLIC_API_URL}/feed`, title: 'TechPlay RSS Feed' }],
      },
    },
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={beVietnamPro.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to API & storage - critical for LCP */}
        <link rel="preconnect" href="https://api-beta.techplay.gg" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api-beta.techplay.gg" />

        {/* Google Fonts - preconnect to both domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Google Analytics - load after page content */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        {/* Google Analytics - lazyOnload for better LCP (loads after page is fully interactive) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0J974Y0X23"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0J974Y0X23');
          `}
        </Script>

        {/* Google Identity Services - for Privee giveaway Google login */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

        {/* Wowhead Tooltips - for WoW Character Analyzer */}
        <Script src="https://wow.zamimg.com/widgets/power.js" strategy="afterInteractive" />
        <Script id="wowhead-config" strategy="afterInteractive">
          {`
            var whTooltips = {
              colorLinks: true,
              iconizeLinks: true,
              renameLinks: true
            };
          `}
        </Script>

        {/* Matomo Analytics */}
        <Script id="matomo-analytics" strategy="lazyOnload">
          {`
            var _paq = window._paq = window._paq || [];
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="//analytics.adizeljkovic.com/";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '1']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
        </Script>

        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
