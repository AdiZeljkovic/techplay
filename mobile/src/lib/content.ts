import { api } from './api';
import { getPage, type Paged } from './paging';

/**
 * The shapes the API actually sends, read off the running endpoints on
 * 7 September 2026 rather than assumed.
 *
 * Only the fields this app draws are declared. A type that lists everything
 * the server happens to send becomes a promise the server never made — and
 * once the app is in the stores, an over-specified type is a compile error
 * waiting for the day somebody trims a field nobody used.
 */

export interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    published_at: string;
    published_at_human: string | null;
    /**
     * Already a sentence: "8 min read", not 8.
     *
     * Typed as a number here at first, and the card appended " min" to it —
     * which put "8 min read min" on the front page. The API formats this
     * server-side so every client says it the same way, and the app's job is
     * to print it rather than to build it.
     */
    reading_time: string | null;
    review_score: number | null;
    author: { username: string; name?: string | null; avatar_url?: string | null } | null;
    category: { name: string; slug: string } | null;
}

/**
 * The whole front page in one request.
 *
 * The web makes this call too, and it is worth keeping: 42 KB once beats six
 * round trips on a mobile network, where latency costs far more than bytes.
 * The rails are named the way the site names them.
 */
export interface Home {
    hero: Article[];
    news: Article[];
    reviews: Article[];
    tech: Article[];
    latest_global: Article[];
    popular_global: Article[];
}

export function getHome(signal?: AbortSignal): Promise<Home> {
    // Public — no token needed, and sending one would only mean the reader
    // waits on a keychain read before the feed can start loading.
    return api<Home>('/home', { auth: false, signal });
}


/**
 * The four section pages the More sheet lists.
 *
 * `/latest` on the site is the mixed feed — the app's Feed tab — and these are
 * the four streams it mixes. All four answer on their own endpoint, verified
 * live: /news, /reviews, /tech and /guides each return 200. That matters,
 * because the alternative for these four rows was a web view, and a section
 * of this site rendered in a browser inside the app is the thing an app is
 * supposed to replace.
 *
 * `/videos` is the fifth on the site and answers 404 here, so it is not
 * offered — a menu row that 404s is worse than a row that is missing.
 */
export const SECTIONS = {
    news: { path: '/news', title: 'News', eyebrow: 'Everything' },
    reviews: { path: '/reviews', title: 'Reviews', eyebrow: 'Scored' },
    tech: { path: '/tech', title: 'Tech', eyebrow: 'Hardware' },
    guides: { path: '/guides', title: 'Guides', eyebrow: 'How to' },
} as const;

export type SectionKey = keyof typeof SECTIONS;

export function isSection(value: string | undefined): value is SectionKey {
    return !!value && value in SECTIONS;
}

export function getSection(
    section: SectionKey,
    page = 1,
    signal?: AbortSignal
): Promise<Paged<Article>> {
    return getPage<Article>(`${SECTIONS[section].path}?page=${page}&per_page=15`, signal);
}
