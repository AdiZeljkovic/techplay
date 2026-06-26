import { Metadata } from "next";
import { Car } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";
import Gta6SectionHero from "@/components/gta6/Gta6SectionHero";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/gta6/vehicles", {
        title: "GTA 6 Vehicles — Confirmed Cars, Bikes, Boats & Aircraft | TechPlay",
        description:
            "Every confirmed Grand Theft Auto VI vehicle — cars, motorcycles, boats and aircraft across Vice City and Leonida, with classes and real-world inspirations.",
        keywords: ["GTA 6 vehicles", "GTA 6 cars", "GTA VI vehicle list"],
    });
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

export default async function Gta6VehiclesPage() {
    const classes = await fetchClasses();

    return (
        <div className="min-h-screen bg-[#05070A]">
            <Gta6SectionHero
                icon={Car}
                title="GTA 6 Vehicles"
                subtitle="Cars, bikes, boats and aircraft confirmed for Leonida"
                breadcrumb="Vehicles"
                badge="The Garage"
                image="/gta6/card-vehicles.png"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-8 py-8">
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
    );
}
