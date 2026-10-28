import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import AchievementsClient from "@/components/gw2/AchievementsClient";
import { DOMAIN_TONE } from "@/lib/gw2domain";

export const metadata: Metadata = {
    title: "Guild Wars 2 Achievements — Your Points, Groups and Nearest Finishes",
    description:
        "Your achievement points added up, the game's groups and categories with how far along each is, what is closest to done, and what you finished lately.",
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/achievements" },
};

/*
 * A static route beside the `achievements` guide family: /gw2/achievements is
 * this page, /gw2/achievements/{slug} is still a guide.
 */
export default function Gw2AchievementsPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                eyebrow="Guild Wars 2 · Achievements"
                title="Achievements"
                description="Your points added up, the game's own groups with how far along each is, and what is closest to done."
                tone={DOMAIN_TONE.achievements}
            />

            <AchievementsClient />
        </div>
    );
}
