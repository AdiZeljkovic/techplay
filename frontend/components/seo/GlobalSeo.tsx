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

            {/* Google Analytics 4 - MOVED TO layout.tsx to avoid conflicts */}


        </>
    );
}
