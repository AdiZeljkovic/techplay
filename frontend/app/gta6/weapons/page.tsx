import { Metadata } from "next";
import { Crosshair } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";
import Gta6SectionHero from "@/components/gta6/Gta6SectionHero";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/gta6/weapons", {
        title: "GTA 6 Weapons — Confirmed Arsenal | TechPlay",
        description:
            "Every confirmed Grand Theft Auto VI weapon — pistols, rifles, shotguns, melee and more from the Leonida arsenal.",
        keywords: ["GTA 6 weapons", "GTA VI guns", "GTA 6 arsenal"],
    });
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

export default async function Gta6WeaponsPage() {
    const types = await fetchTypes();

    return (
        <div className="min-h-screen bg-[#05070A]">
            <Gta6SectionHero
                icon={Crosshair}
                title="GTA 6 Weapons"
                subtitle="The confirmed arsenal of Leonida"
                breadcrumb="Weapons"
                badge="The Arsenal"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-8 py-8">
                <Gta6EntityGrid
                    section="weapons"
                    basePath="/gta6/weapons"
                    apiPath="/gta6/weapons"
                    filterParam="type"
                    filterLabel="Types"
                    filterOptions={types}
                    emptyTitle="No weapons yet"
                    emptyHint="Confirmed weapons will appear here as Rockstar reveals the arsenal."
                />
            </div>
        </div>
    );
}
