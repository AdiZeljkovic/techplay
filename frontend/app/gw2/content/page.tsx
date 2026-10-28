import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import ContentClient from "@/components/gw2/ContentClient";
import { DOMAIN_TONE, HERO_ART } from "@/lib/gw2domain";

export const metadata: Metadata = {
    title: "Guild Wars 2 Raid, Dungeon and World Boss Tracker",
    description:
        "Which raid encounters you have cleared this week, which world bosses and dungeon paths you have done today, and — from the day you connected — what you have done since.",
    keywords: [
        "gw2 raid tracker",
        "guild wars 2 weekly raid clears",
        "gw2 world boss tracker",
        "gw2 dungeon paths today",
    ],
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/content" },
};

export default function Gw2ContentPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                title="Raids, bosses and dungeons"
                description="The game remembers this week and today. Everything longer than that, we remember for you — from the day you connected."
                tone={DOMAIN_TONE.raids}
                art={HERO_ART.raids}
            />

            <ContentClient />
        </div>
    );
}
