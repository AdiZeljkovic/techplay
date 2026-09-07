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
 * A section, a page at a time.
 *
 * Through `getPage` rather than `api` directly: /news answers with a resource
 * collection — `{ data, links, meta }`, no `success` anywhere — while
 * /studios answers with the ApiResponse trait and /games with something else
 * again. The first version of this file assumed one shape, typed it, and
 * TypeScript agreed because a type is a claim rather than a check. The
 * pagination would simply never have advanced.
 */
export function getNews(page = 1, signal?: AbortSignal): Promise<Paged<Article>> {
    return getPage<Article>(`/news?page=${page}&per_page=15`, signal);
}
