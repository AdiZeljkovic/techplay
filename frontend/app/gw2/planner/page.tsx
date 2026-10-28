import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import GoalsClient from "@/components/gw2/GoalsClient";
import { HERO_ART } from "@/lib/gw2domain";

export const metadata: Metadata = {
    title: "Guild Wars 2 Crafting Planner — What You Still Need",
    description:
        "Pick anything craftable in Guild Wars 2 and see what it actually takes, with everything already in your bank, your material storage and your characters' bags subtracted once.",
    keywords: [
        "gw2 crafting calculator",
        "guild wars 2 crafting planner",
        "gw2 ascended armor materials",
        "gw2 what do i need to craft",
        "gw2 material checklist",
    ],
    // Somebody's own inventory. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/planner" },
};

export default function Gw2GoalsPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                eyebrow="Guild Wars 2 · Crafting"
                title="Crafting planner"
                description="Name the thing you want. We count what you already own — bank, material storage, every character's bags — and tell you what is left."
                art={HERO_ART.crafting}
            />

            <GoalsClient />
        </div>
    );
}
