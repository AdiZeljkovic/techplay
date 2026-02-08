"use client";

import Script from "next/script";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

const navigationItems = [
    { name: "News", url: "/news" },
    { name: "Reviews", url: "/reviews" },
    { name: "Guides", url: "/guides" },
    { name: "Videos", url: "/videos" },
    { name: "Hardware", url: "/hardware" },
    { name: "Games Database", url: "/games" },
    { name: "Calendar", url: "/calendar" },
    { name: "Forum", url: "/forum" },
    { name: "Shop", url: "/shop" },
    { name: "About", url: "/about" },
    { name: "Contact", url: "/contact" },
];

export default function GlobalSeo() {
    const { settings, loading } = useSiteSettings();

    if (loading) return null;

    const siteName = settings.seo_organization_name || settings.site_name || "TechPlay";

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": settings.seo_organization_type || "Organization",
        name: siteName,
        url: siteUrl,
        logo: {
            "@type": "ImageObject",
            url: settings.seo_organization_logo
                ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/${settings.seo_organization_logo}`
                : `${siteUrl}/logo.png`,
        },
        sameAs: [
            settings.seo_social_facebook,
            settings.seo_social_twitter ? `https://twitter.com/${settings.seo_social_twitter.replace("@", "")}` : null,
            settings.seo_social_instagram,
            settings.youtube_url,
            settings.discord_url,
        ].filter(Boolean),
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        publisher: {
            "@type": settings.seo_organization_type || "Organization",
            name: siteName,
        },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${siteUrl}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };

    const navigationSchema = {
        "@context": "https://schema.org",
        "@graph": navigationItems.map((item, i) => ({
            "@type": "SiteNavigationElement",
            position: i + 1,
            name: item.name,
            url: `${siteUrl}${item.url}`,
        })),
    };

    return (
        <>
            {/* Organization / Knowledge Graph */}
            <Script id="schema-org-graph" type="application/ld+json" strategy="beforeInteractive">
                {JSON.stringify(organizationSchema)}
            </Script>

            {/* WebSite schema with SearchAction - drives Google Sitelinks search box */}
            <Script id="schema-website" type="application/ld+json" strategy="beforeInteractive">
                {JSON.stringify(websiteSchema)}
            </Script>

            {/* SiteNavigationElement - helps Google choose sitelinks */}
            <Script id="schema-navigation" type="application/ld+json" strategy="beforeInteractive">
                {JSON.stringify(navigationSchema)}
            </Script>
        </>
    );
}
