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
        path: "/news",
        filterParam: "category",
        categoryRoutes: routesFrom(NEWS_CATEGORIES, "/news"),
    },
    reviews: {
        key: "reviews",
        path: "/reviews",
        filterParam: "category",
        showScore: true,
        categoryRoutes: routesFrom(REVIEW_CATEGORIES, "/reviews"),
    },
    tech: {
        key: "tech",
        path: "/hardware",
        filterParam: "category",
        categoryRoutes: routesFrom(HARDWARE_CATEGORIES, "/hardware"),
    },
    guides: {
        key: "guides",
        path: "/guides",
        filterParam: "difficulty",
        categoryRoutes: {},
    },
};
