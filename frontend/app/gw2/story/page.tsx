import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import StoryClient from "@/components/gw2/StoryClient";
import { HERO_ART } from "@/lib/gw2domain";

export const metadata: Metadata = {
    title: "Guild Wars 2 Story Progress",
    description:
        "Which story chapters we can detect on each of your Guild Wars 2 characters — per character, because that is how the game records it.",
    keywords: ["gw2 story progress", "guild wars 2 personal story tracker", "gw2 living world progress"],
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/story" },
};

export default function Gw2StoryPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                title="Story"
                description="What we can detect on one character at a time. The game records story per character, so this is never a verdict on your account."
                art={HERO_ART.story}
            />

            <StoryClient />
        </div>
    );
}
