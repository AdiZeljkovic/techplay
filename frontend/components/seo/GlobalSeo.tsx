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

// NOTE: Organization and WebSite schemas are rendered server-side in layout.tsx
// so they appear in the raw HTML for SEO crawlers. Only SiteNavigationElement
// is added here since it doesn't affect initial HTML SEO scanning.
export default function GlobalSeo() {
    const { loading } = useSiteSettings();

    if (loading) return null;

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
        <Script id="schema-navigation" type="application/ld+json" strategy="afterInteractive">
            {JSON.stringify(navigationSchema)}
        </Script>
    );
}
