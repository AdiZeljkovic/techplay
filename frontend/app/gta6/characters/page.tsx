import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";

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
            <div className="relative bg-[#0B0E14] border-b border-[#161B22] overflow-hidden">
                <div className="absolute inset-0 bg-tech-grid opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/8 via-transparent to-[#0B0E14]" />
                <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 py-10 md:py-12">
                    <nav className="flex items-center gap-1.5 text-[12px] text-[#71717A] mb-4">
                        <Link href="/gta6" className="hover:text-[var(--accent)] transition-colors">GTA 6 Hub</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#A1A1AA]">Characters</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/30 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[var(--accent)]" />
                        </div>
                        <div>
                            <h1 className="font-display text-[28px] md:text-[36px] font-black text-white leading-none">GTA 6 Characters</h1>
                            <p className="text-[#71717A] text-[13px] mt-1.5">The protagonists and cast of Vice City &amp; Leonida</p>
                        </div>
                    </div>
                </div>
            </div>

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
