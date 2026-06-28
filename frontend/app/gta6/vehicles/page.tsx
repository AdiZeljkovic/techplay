import { Metadata } from "next";
import { Car } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";
import Gta6SectionHero from "@/components/gta6/Gta6SectionHero";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateMetadata(): Promise<Metadata> {
    const base = await generatePageMetadata("/gta6/vehicles", {
        title: "GTA 6 Vehicles — Every Confirmed Car, Bike, Boat & Aircraft | TechPlay",
        description:
            "Complete GTA 6 vehicle database — every confirmed car, motorcycle, boat and aircraft spotted in Leonida. Filter by class, explore real-world inspirations and browse the full garage.",
        keywords: ["GTA 6 vehicles", "GTA 6 cars", "GTA 6 all cars", "GTA VI vehicle list", "GTA 6 motorcycles"],
    });
    return {
        ...base,
        openGraph: {
            title: "GTA 6 Vehicles — Every Confirmed Car, Bike, Boat & Aircraft",
            description: "Complete GTA 6 vehicle database — every confirmed car, motorcycle, boat and aircraft spotted in Leonida.",
            url: `${SITE_URL}/gta6/vehicles`,
            siteName: "TechPlay",
            type: "website",
            images: [{ url: `${SITE_URL}/gta6/og-vehicles.png`, width: 1200, height: 630 }],
        },
        alternates: { canonical: `${SITE_URL}/gta6/vehicles` },
    };
}

async function fetchClasses(): Promise<string[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/vehicles/classes`, {
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
        { "@type": "ListItem", "position": 3, "name": "Vehicles", "item": `${SITE_URL}/gta6/vehicles` },
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

export default async function Gta6VehiclesPage() {
    const classes = await fetchClasses();

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameLd) }} />
            <div className="min-h-screen bg-[#05070A]">
                <Gta6SectionHero
                    icon={Car}
                    title="GTA 6 Vehicles"
                    subtitle="Every confirmed car, motorcycle, boat and aircraft spotted across Leonida"
                    breadcrumb="Vehicles"
                    badge="The Garage"
                    image="/gta6/card-vehicles.png"
                />

                <div className="max-w-[1320px] mx-auto px-4 xl:px-8 py-8">
                    <p className="text-[#A1A1AA] text-[15px] leading-relaxed max-w-2xl mb-8">
                        From supercars on the Vice City strip to airboats in the Leonida swamps — GTA 6 is set to feature the most diverse vehicle roster in the series. Every vehicle below has been confirmed via official trailers or community-verified sources. Filter by class and click any entry for the full profile.
                    </p>
                    <Gta6EntityGrid
                        section="vehicles"
                        basePath="/gta6/vehicles"
                        apiPath="/gta6/vehicles"
                        filterParam="class"
                        filterLabel="Classes"
                        filterOptions={classes}
                        emptyTitle="No vehicles yet"
                        emptyHint="Confirmed vehicles will appear here as Rockstar reveals them through trailers and Newswire posts."
                    />
                </div>
            </div>
        </>
    );
}
