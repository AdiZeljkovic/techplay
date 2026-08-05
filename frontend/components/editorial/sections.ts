import { HARDWARE_CATEGORIES, NEWS_CATEGORIES, REVIEW_CATEGORIES } from "@/lib/categories";

/**
 * The four editorial sections, and the things about them that genuinely differ.
 *
 * News, reviews and tech are the same Article rows told apart by their
 * category's type; guides are their own model. They render as one page, so the
 * differences are collected here rather than being spread through the
 * component as conditionals.
 *
 * `path` is not always `key`: tech articles live under /hardware, which is a
 * URL readers and Google already have. Renaming it would cost more than it
 * would tidy.
 */

export type SectionKey = "news" | "reviews" | "tech" | "guides";

export interface SectionConfig {
    /** What the hub endpoint and the list endpoint are keyed on. */
    key: SectionKey;
    /**
     * The page's own heading, and the line under it.
     *
     * Static, and deliberately here rather than read from the hub endpoint:
     * the endpoint is fetched on the client, so an h1 that waited for it was
     * empty in the server HTML — which is the one place a crawler is certain
     * to look. It also says what the page is about rather than what we call
     * the desk internally; "Newsroom" is not what anyone searches for.
     */
    title: string;
    line: string;
    /** URL prefix for the section and its articles. */
    path: string;
    /** Query parameter the list endpoint filters the tab row with. */
    filterParam: "category" | "difficulty";
    /** Reviews carry a score worth showing on the card; nothing else does. */
    showScore?: boolean;
    /**
     * DB category slug → the page that already exists for it.
     *
     * News, reviews and tech all have real, indexed category pages; for news
     * and reviews they hide inside the [slug] route, which decides whether a
     * segment names a category or an article. Where a page exists the tab *is*
     * the link, so those pages keep their internal links and their ranking.
     * Guides have no categories at all — only a difficulty — and filter in
     * place.
     */
    categoryRoutes: Record<string, string>;
}

/**
 * The category lists in lib/categories carry both halves of the mapping: `id`
 * is the slug the database and the API use, `slug` is the segment in the URL.
 * Deriving the routes from them keeps one source of truth, so a category added
 * there does not silently lose its tab here.
 *
 * "all" is the section's own page, not a subpage, and is skipped.
 */
const routesFrom = (
    categories: ReadonlyArray<{ id: string; slug: string }>,
    base: string,
): Record<string, string> =>
    Object.fromEntries(
        categories.filter((c) => c.slug !== "all").map((c) => [c.id, `${base}/${c.slug}`]),
    );

export const SECTIONS: Record<SectionKey, SectionConfig> = {
    news: {
        key: "news",
        title: "Gaming News",
        line: "Breaking stories, analysis and interviews from across gaming.",
        path: "/news",
        filterParam: "category",
        categoryRoutes: routesFrom(NEWS_CATEGORIES, "/news"),
    },
    reviews: {
        key: "reviews",
        title: "Game Reviews",
        line: "Played to the end, then written about honestly.",
        path: "/reviews",
        filterParam: "category",
        showScore: true,
        categoryRoutes: routesFrom(REVIEW_CATEGORIES, "/reviews"),
    },
    tech: {
        key: "tech",
        title: "Hardware & Tech",
        line: "Hardware, handhelds and the machines the games run on.",
        path: "/hardware",
        filterParam: "category",
        categoryRoutes: routesFrom(HARDWARE_CATEGORIES, "/hardware"),
    },
    guides: {
        key: "guides",
        title: "Gaming Guides",
        line: "Walkthroughs, builds and the bits the game never explains.",
        path: "/guides",
        filterParam: "difficulty",
        categoryRoutes: {},
    },
};
