import { Metadata } from "next";
import { Crosshair } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";
import Gta6SectionHero from "@/components/gta6/Gta6SectionHero";
import { fetchGta6Entities, gta6ItemListLd } from "@/lib/gta6";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateMetadata(): Promise<Metadata> {
    const base = await generatePageMetadata("/gta6/weapons", {
        title: "GTA 6 Weapons — Complete Arsenal: Guns, Melee & Explosives",
        description:
            "Every confirmed GTA 6 weapon — pistols, rifles, shotguns, SMGs, melee and explosives from the Leonida arsenal. Full weapon database with types, photos and confirmed details.",
        keywords: ["GTA 6 weapons", "GTA 6 guns", "GTA VI arsenal", "GTA 6 weapons list", "GTA 6 all weapons"],
    });
    return {
        ...base,
        openGraph: {
            title: "GTA 6 Weapons — Complete Arsenal: Guns, Melee & Explosives",
            description: "Every confirmed GTA 6 weapon from the Leonida arsenal — pistols, rifles, shotguns, SMGs, melee and explosives.",
            url: `${SITE_URL}/gta6/weapons`,
            siteName: "TechPlay",
            type: "website",
            images: [{ url: `${SITE_URL}/gta6/og-weapons.png`, width: 1200, height: 630 }],
        },
        alternates: { canonical: `${SITE_URL}/gta6/weapons` },
    };
}

async function fetchTypes(): Promise<string[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/weapons/types`, {
            next: { revalidate: 3600 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data ?? [];
    } catch {
        return [];
    }
}

const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "GTA 6 Hub", "item": `${SITE_URL}/gta6` },
        { "@type": "ListItem", "position": 3, "name": "Weapons", "item": `${SITE_URL}/gta6/weapons` },
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

export default async function Gta6WeaponsPage() {
    const [types, weapons] = await Promise.all([
        fetchTypes(),
        fetchGta6Entities(getServerApiUrl(), "/gta6/weapons"),
    ]);

    const itemListLd = gta6ItemListLd("GTA 6 Weapons", weapons);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameLd) }} />
            {weapons.length > 0 && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
            )}
            <div className="min-h-screen bg-[#05070A]">
                <Gta6SectionHero
                    icon={Crosshair}
                    title="GTA 6 Weapons"
                    subtitle="Every confirmed firearm, melee weapon and explosive in Grand Theft Auto VI"
                    breadcrumb="Weapons"
                    badge="The Arsenal"
                    image="/gta6/card-weapons.png"
                />

                <div className="container-page py-8">
                    <p className="text-[#A1A1AA] text-[15px] leading-relaxed max-w-2xl mb-8">
                        The Leonida criminal underworld doesn&apos;t travel light. Every GTA 6 weapon confirmed via official trailers is catalogued below — from sidearms to heavy weapons.
                    </p>
                    <Gta6EntityGrid
                        section="weapons"
                        basePath="/gta6/weapons"
                        apiPath="/gta6/weapons"
                        filterParam="type"
                        filterLabel="Types"
                        filterOptions={types}
                        emptyTitle="No weapons yet"
                        emptyHint="Confirmed weapons will appear here as Rockstar reveals the arsenal."
                        linkable={false}
                        initialItems={weapons}
                    />
                </div>
            </div>
        </>
    );
}
