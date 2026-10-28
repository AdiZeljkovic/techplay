import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import FractalsClient from "@/components/gw2/FractalsClient";
import { DOMAIN_TONE, HERO_ART } from "@/lib/gw2domain";

export const metadata: Metadata = {
    title: "Guild Wars 2 Fractals — Your Level, Agony Resistance and Today's Fractals",
    description:
        "Your fractal level and tier, Agony Resistance on every level 80 against the Tier 4 target, Fractal Attunement, relics, and today's daily fractals.",
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/fractals" },
};

/*
 * A static route beside the `fractals` guide family: /gw2/fractals is this
 * page, /gw2/fractals/agony-resistance is still the guide.
 */
export default function Gw2FractalsPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                eyebrow="Guild Wars 2 · Fractals"
                title="Fractals"
                description="Where you stand in the Mists: level and tier, Agony Resistance on every character, and today's fractals."
                tone={DOMAIN_TONE.fractals}
                art={HERO_ART.fractals}
            />

            <FractalsClient />
        </div>
    );
}
