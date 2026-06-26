import { Metadata } from "next";
import { Users } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";
import Gta6SectionHero from "@/components/gta6/Gta6SectionHero";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/gta6/characters", {
        title: "GTA 6 Characters — Full Cast of Leonida | TechPlay",
        description:
            "Meet the confirmed Grand Theft Auto VI characters — protagonists Jason Duval and Lucia Caminos and the supporting cast of Vice City and Leonida.",
        keywords: ["GTA 6 characters", "Jason Duval", "Lucia Caminos", "GTA VI cast"],
    });
}

export default function Gta6CharactersPage() {
    return (
        <div className="min-h-screen bg-[#05070A]">
            <Gta6SectionHero
                icon={Users}
                title="GTA 6 Characters"
                subtitle="The protagonists and cast of Vice City & Leonida"
                breadcrumb="Characters"
                badge="The Cast"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-8 py-8">
                <Gta6EntityGrid
                    section="characters"
                    basePath="/gta6/characters"
                    apiPath="/gta6/characters"
                    filterParam="role"
                    filterLabel="Roles"
                    filterOptions={["protagonist", "antagonist", "supporting"]}
                    emptyTitle="No characters found"
                    emptyHint="No characters match your search yet. More are added as Rockstar reveals the cast."
                />
            </div>
        </div>
    );
}
