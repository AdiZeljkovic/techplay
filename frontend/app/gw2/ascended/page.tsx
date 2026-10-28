import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import AscendedClient from "@/components/gw2/AscendedClient";

export const metadata: Metadata = {
    title: "Guild Wars 2 Ascended Armour Planner — Your Set, Piece by Piece",
    description:
        "Your character's ascended armour: which pieces are done, what the rest take out of everything you already own, what is left to buy, and the way there.",
    // Somebody's own characters. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/ascended" },
};

/*
 * Not /gw2/goals/first-ascended-set: that address is the guide, and has been
 * since September. This is the tool beside it, the way /gw2/legendary sits
 * beside the legendary guides.
 */
export default function Gw2AscendedPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                eyebrow="Guild Wars 2 · Goal"
                title="Ascended set"
                description="Your armour piece by piece, what the missing ones take out of what you already own, and the way there."
            />

            <AscendedClient />
        </div>
    );
}
