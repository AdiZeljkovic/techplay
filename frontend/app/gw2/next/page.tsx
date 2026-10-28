import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import { HERO_ART } from "@/lib/gw2domain";
import Gw2Client from "@/components/gw2/Gw2Client";

/**
 * "What should I do next?" — every recommendation, and the controls that
 * re-weigh them. The dashboard shows the top three; this is the rest, with a
 * goal, a time budget and a list of things to leave out.
 */
export const metadata: Metadata = {
    title: "What should I do next in Guild Wars 2? — Your recommendations",
    description:
        "Every recommendation for your own Guild Wars 2 account, re-weighed for the goal you pick, the time you have and what you would rather leave for another night.",
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/next" },
};

export default function Gw2NextPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                eyebrow="What should I do next?"
                title="All recommendations"
                description="Pick a goal, say how long you have, rule out what you are not in the mood for — and the advice is weighed again. Every card says how sure we are."
                art={HERO_ART.next}
            />

            <Gw2Client view="next" />
        </div>
    );
}
