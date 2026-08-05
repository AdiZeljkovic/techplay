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
     * Only hardware has these: /hardware/benchmarks and friends are real,
     * indexed routes. Filtering them away into client-side tabs would leave
     * them without a single internal link, so there the tab *is* the link.
     * News and reviews have no such routes, and there the tabs filter in
     * place — which is faster anyway.
     */
    categoryRoutes?: Record<string, string>;
}

export const SECTIONS: Record<SectionKey, SectionConfig> = {
    news: { key: "news", path: "/news", filterParam: "category" },
    reviews: { key: "reviews", path: "/reviews", filterParam: "category", showScore: true },
    tech: {
        key: "tech",
        path: "/hardware",
        filterParam: "category",
        // Mirrors HARDWARE_CATEGORIES in lib/categories: its `id` is the DB
        // slug, its `slug` is the URL segment. "tech" itself is the section,
        // not a subpage, so it is left to filter in place.
        categoryRoutes: {
            "tech-reviews": "/hardware/reviews",
            "tech-benchmarks": "/hardware/benchmarks",
            "tech-guides": "/hardware/guides",
            "tech-tech-news": "/hardware/news",
        },
    },
    guides: { key: "guides", path: "/guides", filterParam: "difficulty" },
};
