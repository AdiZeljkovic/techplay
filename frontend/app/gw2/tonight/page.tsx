import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import { HERO_ART } from "@/lib/gw2domain";
import TonightClient from "@/components/gw2/TonightClient";

export const metadata: Metadata = {
    title: "Tonight in Guild Wars 2 — A Session Plan for the Time You Have",
    description:
        "Say how long you have and get an ordered session built from what your own account still has outstanding: vault objectives, mastery tiers you can afford, achievements a step from done.",
    keywords: [
        "gw2 what to do tonight",
        "guild wars 2 session plan",
        "gw2 daily routine",
        "gw2 one hour gameplay",
    ],
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/tonight" },
};

export default function Gw2TonightPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                eyebrow="Tonight in GW2"
                title="Tonight in Guild Wars 2"
                description="Nothing new is invented here — this is the advice that already holds, ordered to fit the evening you actually have."
                art={HERO_ART.tonight}
            />

            <TonightClient />
        </div>
    );
}
