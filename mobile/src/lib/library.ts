import { api } from './api';
import { getPage, type Paged } from './paging';

/**
 * The shelf.
 *
 * Seven statuses, and the two that need explaining are the ones added
 * recently. `played` exists because a store import has no honest bucket
 * without it — a platform reports lifetime playtime and never says whether
 * something was finished, so 1,602 hours of Lord of the Rings Online once sat
 * under "haven't started". `replaying` is a second or eighth run at something
 * already finished, and `playthroughs` counts the finishes.
 */
export type ShelfStatus =
    | 'playing'
    | 'replaying'
    | 'played'
    | 'backlog'
    | 'completed'
    | 'wishlist'
    | 'dropped';

export interface ShelfEntry {
    id: number;
    status: ShelfStatus;
    is_favorite: boolean;
    progress: number | null;
    hours_played: number | null;
    playthroughs: number;
    /** Which stores reported it, as opposed to where the reader says they play it. */
    sources: string[];
    platform: string | null;
    completed_at: string | null;
    game: {
        id: number;
        slug: string;
        name: string;
        released: string | null;
        rating: number | null;
        cover_url: string | null;
        platforms: string[];
        genres: string[];
    } | null;
}

/**
 * How each status is drawn.
 *
 * Colours are the site's, from CollectionGrid: playing green, played amber,
 * backlog blue, completed a deeper green, wishlist pink, dropped grey. Teal
 * for replaying — the same family as playing, because it is playing, and its
 * own value, because the distinction is the point of the status.
 */
export const SHELF_STATUS: Record<ShelfStatus, { label: string; color: string }> = {
    playing: { label: 'Playing', color: '#34d399' },
    replaying: { label: 'Replaying', color: '#2dd4bf' },
    played: { label: 'Played', color: '#fbbf24' },
    backlog: { label: 'Backlog', color: '#60a5fa' },
    completed: { label: 'Completed', color: '#22c55e' },
    wishlist: { label: 'Wishlist', color: '#f472b6' },
    dropped: { label: 'Dropped', color: '#9ca3af' },
};

/**
 * The filters the screen offers, in the order a shelf is usually read.
 *
 * `playing` returns replays too — the API decided that, and every count of
 * playing on the site includes them. A filter that disagreed would show a
 * tile reading five over a list of four.
 */
export const SHELF_FILTERS: { value: ShelfStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'playing', label: 'Playing' },
    { value: 'backlog', label: 'Backlog' },
    { value: 'completed', label: 'Completed' },
    { value: 'played', label: 'Played' },
    { value: 'wishlist', label: 'Wishlist' },
    { value: 'dropped', label: 'Dropped' },
];

export function getShelf(
    username: string,
    options: { page?: number; status?: ShelfStatus | ''; search?: string } = {},
    signal?: AbortSignal
): Promise<Paged<ShelfEntry>> {
    const params = new URLSearchParams({
        page: String(options.page ?? 1),
        // The endpoint clamps this between 10 and 60 itself; 24 is its own
        // default and a sensible page for a two-column grid.
        page_size: '24',
    });

    if (options.status) { params.set('status', options.status); }
    if (options.search?.trim()) { params.set('search', options.search.trim()); }

    // Authenticated: a private shelf answers 403 to everyone else, and this
    // reader is looking at their own.
    return getPage<ShelfEntry>(`/users/${username}/collection?${params}`, signal, true);
}

/**
 * Every status a game can be put on, in the order the picker offers them.
 *
 * The filter list above is shorter on purpose — `replaying` is not a filter
 * because the API folds replays into `playing`, but it very much is a thing
 * somebody chooses.
 */
export const SHELF_CHOICES: ShelfStatus[] = [
    'playing',
    'replaying',
    'played',
    'backlog',
    'completed',
    'wishlist',
    'dropped',
];

/** What this reader has already said about one game, or null if nothing. */
export function getShelfEntry(slug: string, signal?: AbortSignal): Promise<ShelfEntry | null> {
    return api<ShelfEntry | null>(`/collection/games/${slug}`, { signal });
}

/**
 * Put a game on a shelf, or move it between them.
 *
 * One call for both, because the API upserts: there is no separate "add" and
 * "change", and inventing the distinction in the app would mean guessing
 * which one applies and getting it wrong the first time somebody taps twice.
 *
 * Completing a game pays 50 Bounty and 15 XP — once per game, ever, gated on
 * the ledger rather than on the status. So this is safe to call repeatedly:
 * moving a finished game back and forth cannot farm anything.
 */
export function setShelfStatus(slug: string, status: ShelfStatus): Promise<ShelfEntry> {
    return api<ShelfEntry>(`/collection/games/${slug}`, {
        method: 'PUT',
        body: { status },
    });
}

/** Take it off the shelf entirely. */
export function removeFromShelf(slug: string): Promise<void> {
    return api<void>(`/collection/games/${slug}`, { method: 'DELETE' });
}
