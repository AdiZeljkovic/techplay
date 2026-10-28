import type { PublicGuide } from "@/lib/gw2public";

/**
 * Structured data for the public Guild Wars 2 pages.
 *
 * Only types that describe what the page is. A recipe page is a reference page
 * about an item, not a Product — there is no price in money and no seller, and
 * marking it up as one would be a claim Google can check and we would fail. So:
 * breadcrumbs everywhere, Article for the guides (they are written pieces with
 * a date), and WebApplication for the tool itself, the same type /wow-analyzer
 * and /backlog-advisor carry.
 */

const SITE = "https://techplay.gg";

/** The game the pages are about, by its official site. */
const GAME = { "@type": "VideoGame", name: "Guild Wars 2", url: "https://www.guildwars2.com" };

/**
 * Serialised for a `<script>` tag. Item names come from the game's API and
 * a `<` in one would otherwise be able to close the tag.
 */
export function jsonLd(data: object): string {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function gw2Breadcrumb(trail: { name: string; path: string }[]): object {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [{ name: "Home", path: "" }, ...trail].map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: crumb.name,
            item: `${SITE}${crumb.path}`,
        })),
    };
}

export function gw2GuideArticle(guide: PublicGuide): object {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.seo.description ?? guide.standfirst ?? undefined,
        url: `${SITE}${guide.path}`,
        image: guide.hero_image ?? undefined,
        dateModified: guide.updated_at ?? undefined,
        about: GAME,
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: "TechPlay", url: SITE },
        publisher: { "@type": "Organization", name: "TechPlay", url: SITE },
    };
}

export const gw2Application = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Guild Wars 2 Progression Advisor",
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    url: `${SITE}/gw2`,
    about: GAME,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "TechPlay", url: SITE },
    featureList: [
        "Reads your own Guild Wars 2 account through an API key",
        "Recommends what to do next, with how sure it is",
        "Plans crafting against what is already in your bank",
        "Tracks raids, world bosses and dungeons since you connected",
        "Links every item and achievement to the official wiki",
    ],
};
