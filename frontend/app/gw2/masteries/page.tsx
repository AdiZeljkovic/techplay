import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import MasteriesClient from "@/components/gw2/MasteriesClient";
import { DOMAIN_TONE } from "@/lib/gw2domain";

export const metadata: Metadata = {
    title: "Guild Wars 2 Mastery Tracker — Points, Tiers and What They Buy",
    description:
        "Every Guild Wars 2 mastery track with your own progress against it: points spent of the total each region needs, which tier comes next, what it costs, and which ones your unspent points already reach.",
    keywords: [
        "gw2 mastery tracker",
        "guild wars 2 mastery points",
        "gw2 mastery progress",
        "gw2 unspent mastery points",
        "gw2 mastery point cost",
    ],
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/masteries" },
};

export default function Gw2MasteriesPage() {
    return (
        <div className="tp-page">
            <Gw2Hero
                title="Masteries"
                description="Points are locked to the region that earned them, and the tiers get steeply more expensive. This is where yours can actually go."
                tone={DOMAIN_TONE.masteries}
            />

            <MasteriesClient />
        </div>
    );
}
