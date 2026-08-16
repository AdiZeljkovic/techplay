import { Metadata } from "next";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { generatePageMetadata } from "@/lib/seo";
import Gta6MapClient from "@/components/gta6/Gta6MapClient";

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateMetadata(): Promise<Metadata> {
    const base = await generatePageMetadata("/gta6/map", {
        title: "GTA 6 Interactive Map — 1,000+ Locations in Vice City & Leonida",
        description:
            "Explore every confirmed and community-discovered GTA 6 location across Vice City and the state of Leonida. Filter by category — click any pin for details and in-game footage.",
        keywords: ["GTA 6 interactive map", "GTA 6 map locations", "GTA 6 Leonida map", "Vice City map GTA 6"],
    });
    return {
        ...base,
        openGraph: {
            title: "GTA 6 Interactive Map — 1,000+ Locations in Vice City & Leonida",
            description: "Explore every confirmed GTA 6 location across Vice City and Leonida. 1,000+ pins, filterable by category.",
            url: `${SITE_URL}/gta6/map`,
            siteName: "TechPlay",
            type: "website",
            images: [{ url: `${SITE_URL}/gta6/og-map.png`, width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            title: "GTA 6 Interactive Map | TechPlay",
            description: "1,000+ GTA 6 locations mapped across Vice City and Leonida.",
        },
        alternates: { canonical: `${SITE_URL}/gta6/map` },
        robots: { index: true, follow: true },
    };
}

async function fetchCategories(): Promise<string[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/categories`, {
            next: { revalidate: 86400 },
            headers: serverHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data ?? [];
    } catch {
        return [];
    }
}

async function fetchLocationCount(): Promise<number> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/locations`, {
            next: { revalidate: 86400 },
            headers: serverHeaders(),
        });
        if (!res.ok) return 0;
        const json = await res.json();
        return (json.data ?? []).length;
    } catch {
        return 0;
    }
}

export default async function Gta6MapPage() {
    const [categories, totalLocations] = await Promise.all([
        fetchCategories(),
        fetchLocationCount(),
    ]);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": "Grand Theft Auto VI",
        "alternateName": "GTA 6",
        "description": "Open-world action-adventure game set in Vice City and Leonida, releasing November 19, 2026.",
        "gamePlatform": ["PlayStation 5", "Xbox Series X", "Xbox Series S"],
        "operatingSystem": "PlayStation 5, Xbox Series X/S",
        "applicationCategory": "Game",
        "publisher": { "@type": "Organization", "name": "Rockstar Games" },
        "url": `${SITE_URL}/gta6/map`,
        "datePublished": "2026-11-19",
        "dateModified": new Date().toISOString(),
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "GTA 6 Hub", "item": `${SITE_URL}/gta6` },
            { "@type": "ListItem", "position": 3, "name": "Interactive Map", "item": `${SITE_URL}/gta6/map` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <div className="bg-[var(--surface-0)]">
                <Gta6MapClient initialCategories={categories} totalLocations={totalLocations} />
            </div>
        </>
    );
}
