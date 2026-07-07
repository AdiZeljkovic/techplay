import { Metadata } from "next";
import { Users } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";
import Gta6SectionHero from "@/components/gta6/Gta6SectionHero";
import { fetchGta6Entities, gta6ItemListLd } from "@/lib/gta6";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateMetadata(): Promise<Metadata> {
    const base = await generatePageMetadata("/gta6/characters", {
        title: "GTA 6 Characters — Jason, Lucia & Every Confirmed Cast Member",
        description:
            "Meet every confirmed GTA 6 character — from protagonists Jason Duval and Lucia Caminos to the full supporting cast of Vice City and Leonida. Full profiles, roles and gallery.",
        keywords: ["GTA 6 characters", "GTA 6 characters list", "Jason Duval", "Lucia Caminos", "GTA VI cast", "who are the characters in GTA 6"],
    });
    return {
        ...base,
        openGraph: {
            title: "GTA 6 Characters — Jason, Lucia & Every Confirmed Cast Member",
            description: "Meet every confirmed GTA 6 character — protagonists Jason Duval and Lucia Caminos and the full cast.",
            url: `${SITE_URL}/gta6/characters`,
            siteName: "TechPlay",
            type: "website",
            images: [{ url: `${SITE_URL}/gta6/og-characters.png`, width: 1200, height: 630 }],
        },
        alternates: { canonical: `${SITE_URL}/gta6/characters` },
    };
}

const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "GTA 6 Hub", "item": `${SITE_URL}/gta6` },
        { "@type": "ListItem", "position": 3, "name": "Characters", "item": `${SITE_URL}/gta6/characters` },
    ],
};

const videoGameLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Grand Theft Auto VI",
    "alternateName": "GTA 6",
    "url": `${SITE_URL}/gta6`,
    "datePublished": "2026-11-19",
    "publisher": { "@type": "Organization", "name": "Rockstar Games" },
    "gamePlatform": ["PlayStation 5", "Xbox Series X", "Xbox Series S"],
};

export default async function Gta6CharactersPage() {
    const characters = await fetchGta6Entities(getServerApiUrl(), "/gta6/characters");

    const itemListLd = gta6ItemListLd("GTA 6 Characters", characters, "/gta6/characters");

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameLd) }} />
            {characters.length > 0 && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
            )}
            <div className="min-h-screen bg-[#05070A]">
                <Gta6SectionHero
                    icon={Users}
                    title="GTA 6 Characters"
                    subtitle="Jason, Lucia and every confirmed face in Vice City & Leonida"
                    breadcrumb="Characters"
                    badge="The Cast"
                    image="/gta6/hero.jpg"
                />

                <div className="max-w-[1320px] mx-auto px-4 xl:px-8 py-8">
                    <p className="text-[#A1A1AA] text-[15px] leading-relaxed max-w-2xl mb-8">
                        Grand Theft Auto VI introduces Jason Duval and Lucia Caminos as a dual-protagonist duo — Lucia being the series&apos; first playable female lead. Below is every confirmed GTA 6 character, updated as Rockstar reveals the full cast. Click any character for their full profile, background and gallery.
                    </p>
                    <Gta6EntityGrid
                        section="characters"
                        basePath="/gta6/characters"
                        apiPath="/gta6/characters"
                        filterParam="role"
                        filterLabel="Roles"
                        filterOptions={["protagonist", "antagonist", "supporting"]}
                        emptyTitle="No characters found"
                        emptyHint="No characters match your search yet. More are added as Rockstar reveals the cast."
                        initialItems={characters}
                    />
                </div>
            </div>
        </>
    );
}
