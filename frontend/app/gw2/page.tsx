import type { Metadata } from "next";
import { Compass } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import Gw2Client from "@/components/gw2/Gw2Client";

/**
 * The Guild Wars 2 Progression Advisor.
 *
 * Client-rendered below the hero, and deliberately so: everything on this page
 * is one person's own account, read with a key only they have provided. There is
 * nothing here to server-render for a crawler and nothing to cache between
 * visitors.
 *
 * That is also why this page is not the SEO surface for the tool. The public,
 * indexable pages — mastery guides, fractal explainers, achievement walkthroughs
 * — are useful without a key and are what brings people here; connecting an
 * account is what personalises them. Those pages are still to be built, and the
 * metadata below is honest about what this one is until they exist.
 */
export const metadata: Metadata = {
    title: "Guild Wars 2 Progression Advisor — What Should I Do Next?",
    description:
        "Connect your Guild Wars 2 account and get specific next steps: unspent mastery points, ascended gear gaps, Agony Resistance for Tier 4 fractals, achievements you are one step from finishing, and what is still open in your Wizard's Vault.",
    keywords: [
        "guild wars 2 progression",
        "gw2 what should i do next",
        "gw2 account tracker",
        "gw2 mastery points tracker",
        "gw2 ascended gear checklist",
        "gw2 agony resistance calculator",
        "gw2 wizards vault tracker",
        "gw2 achievement tracker",
        "guild wars 2 api key tool",
    ],
    // A dashboard of somebody's own account has nothing to offer a search
    // result, and indexing it would mean indexing a page that renders empty for
    // everyone who is not signed in.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2" },
};

export default function Gw2Page() {
    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="What should I do next?"
                description="Progression guidance built from your own Guild Wars 2 account — not a checklist, and nothing we had to guess."
                iconNode={<Compass size={22} aria-hidden />}
            />

            <Container className="py-8">
                <Gw2Client />
            </Container>
        </div>
    );
}
