import { api } from './api';

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
    reading_time: number | null;
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
 * A paginated section.
 *
 * Laravel's paginator puts the rows under `data` and the envelope around
 * them, and the ApiResponse trait wraps that again — so what arrives here is
 * already unwrapped once by the client and still has the paginator's own
 * `data` inside it.
 */
export interface Page<T> {
    data: T[];
    current_page: number;
    last_page: number;
}

export function getNews(page = 1, signal?: AbortSignal): Promise<Page<Article>> {
    return api<Page<Article>>(`/news?page=${page}&per_page=15`, { auth: false, signal });
}
