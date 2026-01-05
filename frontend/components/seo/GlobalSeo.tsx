"use client";

import Script from "next/script";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function GlobalSeo() {
    const { settings, loading } = useSiteSettings();

    if (loading) return null;

    const ga4Id = settings.seo_google_analytics_id;
    const gtmId = settings.seo_gtm_id;

    return (
        <>
            {/* Knowledge Graph JSON-LD */}
            <Script id="schema-org-graph" type="application/ld+json" strategy="beforeInteractive">
                {`
                    {
                        "@context": "https://schema.org",
                        "@type": "${settings.seo_organization_type || 'Organization'}",
                        "name": "${settings.seo_organization_name || settings.site_name || 'TechPlay'}",
                        "url": "${process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg'}",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "${settings.seo_organization_logo ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/${settings.seo_organization_logo}` : `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}"
                        },
                        "sameAs": [
                            "${settings.seo_social_facebook || ''}",
                            "${settings.seo_social_twitter ? `https://twitter.com/${settings.seo_social_twitter.replace('@', '')}` : ''}",
                            "${settings.seo_social_instagram || ''}",
                            "${settings.youtube_url || ''}",
                            "${settings.discord_url || ''}"
                        ].filter(Boolean)
                    }
                `}
            </Script>

            {/* Google Analytics 4 */}
            {ga4Id && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${ga4Id}');
                        `}
                    </Script>
                </>
            )}

            {/* Google Tag Manager */}
            {gtmId && (
                <>
                    <Script id="google-tag-manager" strategy="afterInteractive">
                        {`
                            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','dataLayer','${gtmId}');
                        `}
                    </Script>
                </>
            )}
        </>
    );
}
