import type { Metadata } from "next";
import AdvisorClient from "./AdvisorClient";
import { generatePageMetadata } from "@/lib/seo";

// Through the shared builder so the page gets a canonical; see /calendar.
export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/backlog-advisor", {
        title: "Backlog Advisor",
        description:
            "Personalised game recommendations scored against your own collection — the genres you finish, the players who share your shelf, and how good the game actually is.",
    });
}

const URL = "https://techplay.gg/backlog-advisor";

const DESCRIPTION =
    "Recommends what to play next from the games you already own, scored against the genres you finish, the lengths you finish, and what players with a similar shelf went on to play.";

/*
 * A tool, marked as one.
 *
 * This page had no structured data at all, which is the same gap /wow-analyzer
 * was filled for — and the two are the same kind of thing, so they carry the
 * same type rather than a second vocabulary invented here. The feature list is
 * what the tool actually does; nothing in it describes a screen that does not
 * exist.
 *
 * `offers` at zero is not decoration: WebApplication without a price reads as
 * unknown, and "free" is a fact worth stating about a tool behind a sign-in.
 */
const application = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Backlog Advisor",
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    url: URL,
    description: DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "TechPlay", url: "https://techplay.gg" },
    featureList: [
        "Reads your own game collection",
        "Scores unplayed games against the genres you finish",
        "Weighs how long a game takes against what you complete",
        "Compares your shelf with players who share it",
        "Ranks by community score alongside personal fit",
    ],
};

const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://techplay.gg" },
        { "@type": "ListItem", position: 2, name: "Tools", item: "https://techplay.gg/tools" },
        { "@type": "ListItem", position: 3, name: "Backlog Advisor", item: URL },
    ],
};

export default function BacklogAdvisorPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(application) }} />
            <AdvisorClient />
        </>
    );
}
