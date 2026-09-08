import { api } from '@/lib/api';

/**
 * The game catalogue — 333,198 rows, and the site's largest surface.
 *
 * The app's Games tab was a search box and a list of eight-field results. The
 * site's `/games` is a different thing: a hero with the count, four ways in, a
 * facet filter and a grid of covers. A catalogue you can only reach by already
 * knowing what you want is not a catalogue, it is a lookup.
 *
 * Two endpoints, both read off the running API rather than assumed:
 *
 *   /games/hub   { success, data: { stats, facets, most_wishlisted } }
 *   /games?…     { count, next, previous, results }   ← not a Laravel paginator
 *
 * The second one is why `paging.ts` exists. It is the `{count, next, results}`
 * convention, so `count` is the total rows and not the page size, and there is
 * no `last_page` to compare against — `next` being null is the end.
 */
export interface CatalogueGame {
    id: number;
    slug: string;
    name: string;
    released: string | null;
    cover_url: string | null;
    rating: number | null;
    platforms?: string[];
    genres?: string[];
}

export interface Facet {
    key: string;
    label: string;
    count: number;
}

export interface Hub {
    stats: { games: number };
    facets: {
        genres: { name: string; count: number }[];
        platforms: Facet[];
        eras: (Facet & { from: number; to: number })[];
        status: Facet[];
    };
    most_wishlisted: { slug: string; name: string; cover_url: string | null; wishlists: number }[];
}

export interface GamePage {
    count: number;
    next: string | null;
    results: CatalogueGame[];
}

/**
 * The four ways in.
 *
 * The site's own note on this row is worth carrying: the fourth used to open
 * the filter drawer, which asked another question where its three neighbours
 * each showed you games — and asked it about platforms, which the chip row
 * already answers. Most Popular replaced it, because IGDB carries a popularity
 * reading on 152,092 games and nothing else on the page surfaced it.
 */
export const SHELVES = [
    { key: '-rating', title: 'Top Rated', line: 'The highest scored games in the catalogue.' },
    { key: '-released', title: 'Recently Added', line: 'The newest arrivals in our database.' },
    { key: 'upcoming', title: 'Upcoming Releases', line: 'What is still to come, on every platform.' },
    { key: '-popularity', title: 'Most Popular', line: 'What people are actually playing right now.' },
] as const;

export const SORTS = [
    { value: '-rating', label: 'Top Rated' },
    { value: '-popularity', label: 'Most Popular' },
    { value: '-released', label: 'Newest' },
    { value: 'released', label: 'Oldest' },
    { value: 'name', label: 'A–Z' },
] as const;

export interface Filters {
    search: string;
    genre: string | null;
    platform: string | null;
    era: string | null;
    status: string;
    sort: string;
}

export const NO_FILTERS: Filters = {
    search: '',
    genre: null,
    platform: null,
    era: null,
    status: 'all',
    sort: '-popularity',
};

/** How many of the six are actually narrowing the list, for the button's pip. */
export function activeCount(f: Filters): number {
    return [f.genre, f.platform, f.era, f.status !== 'all' ? f.status : null].filter(Boolean).length;
}

export function getHub(signal?: AbortSignal): Promise<Hub> {
    return api<Hub>('/games/hub', { auth: false, signal });
}

export function getGames(
    filters: Filters,
    page: number,
    eras: Hub['facets']['eras'] | undefined,
    signal?: AbortSignal
): Promise<GamePage> {
    const q = new URLSearchParams();

    if (filters.search) { q.set('search', filters.search); }
    if (filters.genre) { q.set('genres', filters.genre); }
    if (filters.platform) { q.set('platforms', filters.platform); }
    if (filters.status !== 'all') { q.set('status', filters.status); }
    if (filters.sort) { q.set('ordering', filters.sort); }

    // An era is a band, not a value — the endpoint takes the two years, and
    // the band itself is only known from the hub's facets.
    const band = eras?.find((e) => e.key === filters.era);

    if (band) {
        q.set('year_from', String(band.from));
        q.set('year_to', String(band.to));
    }

    q.set('page', String(page));
    q.set('page_size', '30');

    return api<GamePage>(`/games?${q}`, { auth: false, raw: true, signal });
}

/** The year alone, which is all a cover has room for. */
export function releaseYear(released: string | null): string | null {
    if (!released) { return null; }

    const year = released.slice(0, 4);

    return /^\d{4}$/.test(year) ? year : null;
}
