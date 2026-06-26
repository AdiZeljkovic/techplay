import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Crosshair } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import Gta6EntityGrid from "@/components/gta6/Gta6EntityGrid";

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
            <div className="relative bg-[#0B0E14] border-b border-[#161B22] overflow-hidden">
                <div className="absolute inset-0 bg-tech-grid opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/8 via-transparent to-[#0B0E14]" />
                <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 py-10 md:py-12">
                    <nav className="flex items-center gap-1.5 text-[12px] text-[#71717A] mb-4">
                        <Link href="/gta6" className="hover:text-[var(--accent)] transition-colors">GTA 6 Hub</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#A1A1AA]">Weapons</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/30 flex items-center justify-center">
                            <Crosshair className="w-5 h-5 text-[var(--accent)]" />
                        </div>
                        <div>
                            <h1 className="font-display text-[28px] md:text-[36px] font-black text-white leading-none">GTA 6 Weapons</h1>
                            <p className="text-[#71717A] text-[13px] mt-1.5">The confirmed arsenal of Leonida</p>
                        </div>
                    </div>
                </div>
            </div>

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
