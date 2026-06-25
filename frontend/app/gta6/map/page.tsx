import { Metadata } from "next";
import { getServerApiUrl } from "@/lib/api";
import Gta6MapHero from "@/components/gta6/Gta6MapHero";
import Gta6MapClient from "@/components/gta6/Gta6MapClient";

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export const metadata: Metadata = {
    title: "GTA 6 Interactive Map — All Known Locations | TechPlay",
    description:
        "Explore all confirmed and community-discovered GTA 6 locations across Vice City and Leonida. Interactive map with 1000+ points of interest from official trailers.",
    openGraph: {
        title: "GTA 6 Interactive Map — All Known Locations",
        description:
            "Explore all confirmed and community-discovered GTA 6 locations across Vice City and Leonida. Interactive map with 1000+ points of interest.",
        url: `${SITE_URL}/gta6/map`,
        siteName: "TechPlay",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "GTA 6 Interactive Map | TechPlay",
        description: "1000+ GTA 6 locations mapped across Vice City and Leonida.",
    },
    alternates: { canonical: `${SITE_URL}/gta6/map` },
    robots: { index: true, follow: true },
};

async function fetchCategories(): Promise<string[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/categories`, {
            next: { revalidate: 86400 },
            headers: { Accept: "application/json" },
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
            headers: { Accept: "application/json" },
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
        "publisher": {
            "@type": "Organization",
            "name": "Rockstar Games",
        },
        "url": `${SITE_URL}/gta6/map`,
        "datePublished": "2026-11-19",
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="min-h-screen bg-[#05070A]">
                <Gta6MapHero totalLocations={totalLocations} />
                <Gta6MapClient initialCategories={categories} />
            </div>
        </>
    );
}
