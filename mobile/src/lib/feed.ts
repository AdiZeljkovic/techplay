import { api } from '@/lib/api';

/**
 * The Feed, which is not the news list.
 *
 * The app's Feed tab read `/news` and called it "Everything" — so reviews,
 * hardware and guides never appeared in it, and the tab's own heading was
 * wrong. The site's `/latest` is a different thing entirely: one mixed stream
 * with its own endpoint, its own item shape and a personalised ordering.
 *
 * Two endpoints, verified live:
 *
 *   /feed/latest?page&limit[&type]   200, public
 *   /feed/personalized?page&limit    401 without a token
 *
 * The item is not an `Article`. It carries `section` (which of the four this
 * is), an absolute `url`, a `kind`, and on the personalised feed a `reason`
 * saying why it is where it is — which, as the web component's docblock puts
 * it, is the part a reader can actually check.
 */
export interface FeedItem {
    id: string;
    kind: 'article' | 'guide';
    section: 'news' | 'reviews' | 'tech' | 'guides';
    slug: string;
    url: string;
    title: string;
    excerpt: string | null;
    featured_image_url: string | null;
    published_at: string | null;
    views: number;
    review_score: number | string | null;
    category: { name: string; slug: string } | null;
    author: { username: string; name: string; avatar: string | null } | null;
    reason?: string | null;
}

export interface FeedPage {
    items: FeedItem[];
    meta: { current_page: number; last_page: number; total: number };
    /** Personalised feed only: false means we had nothing to go on. */
    personalised?: boolean;
    interests?: string[];
}

/** The hero's row: which feed, not which section. */
export const FEED_VIEWS = [
    { id: 'latest', label: 'Latest' },
    { id: 'you', label: 'For you' },
] as const;

export const FEED_SECTIONS = [
    { id: 'all', label: 'Everything' },
    { id: 'news', label: 'News' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'tech', label: 'Tech' },
    { id: 'guides', label: 'Guides' },
] as const;

/** What the badge on the cover says, singular — it labels one piece. */
export const SECTION_LABEL: Record<FeedItem['section'], string> = {
    news: 'News',
    reviews: 'Review',
    tech: 'Tech',
    guides: 'Guide',
};

const LIMIT = 20;

export function getFeed(section: string, page = 1, signal?: AbortSignal): Promise<FeedPage> {
    const query = new URLSearchParams({ page: String(page), limit: String(LIMIT) });

    if (section !== 'all') { query.set('type', section); }

    return api<FeedPage>(`/feed/latest?${query}`, { auth: false, signal });
}

export function getPersonalFeed(page = 1, signal?: AbortSignal): Promise<FeedPage> {
    return api<FeedPage>(`/feed/personalized?page=${page}&limit=${LIMIT}`, { signal });
}

/**
 * Where a feed item opens.
 *
 * The server sends a web path — `/news/slug`, `/reviews/slug`, `/guides/slug`.
 * Every one of the four is an article and the app draws all four on the same
 * screen, so the section in the URL is decoration here; the slug is the part
 * that matters.
 */
export function routeForItem(item: FeedItem): string {
    return `/news/${item.slug}`;
}
