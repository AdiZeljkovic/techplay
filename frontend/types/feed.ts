/**
 * One stream across everything the site publishes.
 *
 * The feed unions articles and guides, so an item is not an Article — it does
 * not carry content, SEO fields or comments, and it already knows its own URL
 * rather than leaving callers to work it out from the category type.
 */

export type FeedSection = "news" | "reviews" | "tech" | "guides";

export interface FeedItem {
    /** Unique across kinds: an article and a guide can share a numeric id. */
    id: string;
    kind: "article" | "guide";
    section: FeedSection;
    slug: string;
    /** Where the piece lives. Tech articles sit under /hardware. */
    url: string;
    title: string;
    excerpt: string | null;
    featured_image_url: string | null;
    published_at: string | null;
    views: number;
    review_score: number | null;
    category: { name: string; slug: string } | null;
    author: { username: string; name: string; avatar: string | null } | null;
    /** Only on the personalised feed, and only when something matched. */
    reason?: string | null;
}

export interface FeedMeta {
    current_page: number;
    last_page: number;
    total: number;
}

export interface LatestFeed {
    items: FeedItem[];
    meta: FeedMeta;
}

export interface PersonalFeed extends LatestFeed {
    /**
     * False when we had nothing to go on and the feed is simply the newest.
     * Surfaces should say so rather than presenting it as a recommendation.
     */
    personalised: boolean;
    /** What the profile was built from, so the page can be specific. */
    basis: { reads: number; bookmarks: number; comments: number; games: number };
    /** The strongest interests, in the reader's own tags. */
    interests: string[];
}
