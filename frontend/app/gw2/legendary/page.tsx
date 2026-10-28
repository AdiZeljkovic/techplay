import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import LegendaryClient from "@/components/gw2/LegendaryClient";

export const metadata: Metadata = {
    title: "Guild Wars 2 legendary planner",
    description:
        "Every Guild Wars 2 legendary, what your armory already holds, and a plan for the ones whose recipe we have checked — counted against your bank and wallet.",
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/legendary" },
};

export default function Gw2LegendaryPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                title="Legendaries"
                description="What your armory holds, and a plan for each legendary whose recipe we have checked — against your bank and your wallet."
            />

            <LegendaryClient />
        </div>
    );
}
