import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import GlobalSeo from "@/components/seo/GlobalSeo";
import RecaptchaProvider from "@/components/providers/RecaptchaProvider";
import { Toaster } from "react-hot-toast";


const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-main",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
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
      index: settings.seo_noindex_search !== '1' && settings.seo_noindex_search !== 'true',
      follow: settings.seo_noindex_search !== '1' && settings.seo_noindex_search !== 'true',
    },
    verification: {
      google: settings.seo_google_verification,
      yandex: settings.seo_yandex_verification,
      yahoo: settings.seo_bing_verification, // Bing often used for Yahoo too
      other: {
        'msvalidate.01': settings.seo_bing_verification,
        'baidu-site-verification': settings.seo_baidu_verification,
      },
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={beVietnamPro.variable} suppressHydrationWarning>
      <head>
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <SiteSettingsProvider>
            <CartProvider>
              <AuthProvider>
                <RecaptchaProvider>
                  <Header />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer />
                  <CookieConsentBanner />
                  <GlobalSeo />
                  <Toaster position="bottom-right" />
                </RecaptchaProvider>
              </AuthProvider>
            </CartProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
