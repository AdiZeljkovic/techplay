import { api } from '@/lib/api';
import { removeFromShelf, setShelfStatus } from '@/lib/library';

/**
 * The release calendar, and the two things you can do to a release.
 *
 * Both actions already existed on the site and in the API; the app listed the
 * month and offered neither. They are the reason this screen is worth opening
 * on a Tuesday, and they are what push notifications will eventually carry.
 */

export interface Release {
    slug: string;
    name: string;
    released: string | null;
    cover_url: string | null;
    added: number;
    genres: string[];
    platforms: string[];
    publisher: string | null;
    wishlists: number;
    wishlisted: boolean;
    reminder: boolean;
}

export interface Day {
    date: string;
    day: number;
    weekday: string;
    games: Release[];
    total: number;
}

export interface Month {
    key: string;
    label: string;
    year: number;
    previous: string;
    next: string;
    is_current: boolean;
}

export interface Calendar {
    month: Month;
    stats: { releases: number; wishlisted: number; showing: number };
    hero: Release | null;
    most_anticipated: Release[];
    days: Day[];
    platform_breakdown: { key: string; label: string; count: number; percent: number }[];
    genres: { name: string; count: number }[];
}

export type CalendarSort = 'date' | 'anticipated';

export interface CalendarQuery {
    month?: string | null;
    platform?: string | null;
    genre?: string | null;
    sort?: CalendarSort;
}

/**
 * The calendar wants the key, and the catalogue wants the label.
 *
 * They are two endpoints with the same-shaped `{ key, label }` breakdown and
 * opposite rules, which is exactly how this was got wrong the first time: the
 * catalogue's trap is written down in the README, so it was assumed to apply
 * here too. It does not. `/calendar` validates
 * `in:pc,playstation,xbox,nintendo` and answers a label with a **422**, and
 * `sort` is `anticipated` — not `hype`, which is what the site's own UI calls
 * it.
 *
 * Checked against the running endpoint rather than reasoned about:
 *
 *   platform=Xbox   422
 *   platform=xbox   200
 *   sort=hype       422
 *   sort=anticipated 200
 */
export function calendarUrl(q: CalendarQuery): string {
    const params = new URLSearchParams();

    if (q.month) params.set('month', q.month);
    if (q.platform) params.set('platform', q.platform);
    if (q.genre) params.set('genre', q.genre);
    if (q.sort && q.sort !== 'date') params.set('sort', q.sort);

    const query = params.toString();

    return `/calendar${query ? `?${query}` : ''}`;
}

export function getCalendar(q: CalendarQuery, signal?: AbortSignal): Promise<Calendar> {
    return api<Calendar>(calendarUrl(q), { auth: true, signal });
}

/** Ring me when this one lands. Returns the state the server settled on. */
export async function toggleReminder(slug: string): Promise<boolean> {
    const result = await api<{ reminder?: boolean } | null>(`/calendar/${slug}/reminder`, {
        method: 'POST',
    });

    return Boolean(result?.reminder);
}

/**
 * Wishlist is a shelf, not a flag.
 *
 * There is no toggle endpoint: wanting a game is `status = wishlist` on the
 * collection, and not wanting it is having no row at all. Removing outright
 * rather than moving to another shelf, because a calendar row knows nothing
 * about whether somebody already owns or finished the game.
 */
export async function toggleWishlist(slug: string, wishlisted: boolean): Promise<boolean> {
    if (wishlisted) {
        await removeFromShelf(slug);

        return false;
    }

    await setShelfStatus(slug, 'wishlist');

    return true;
}

/** Platform families, so a row reads without spelling every SKU out. */
const FAMILIES: { mark: string; tint: string; test: (p: string) => boolean }[] = [
    { mark: 'PC', tint: '#60a5fa', test: (p) => /PC|WINDOWS|LINUX|MAC|STEAM/.test(p) },
    { mark: 'PS', tint: '#3b82f6', test: (p) => /PLAYSTATION/.test(p) || /^PS\d?\b/.test(p) },
    { mark: 'XB', tint: '#34d399', test: (p) => /XBOX/.test(p) },
    { mark: 'NS', tint: '#ef4444', test: (p) => /SWITCH|NINTENDO/.test(p) },
];

export function platformMarks(platforms: string[]): { mark: string; tint: string }[] {
    const upper = platforms.map((p) => p.toUpperCase());

    return FAMILIES.filter((f) => upper.some((p) => f.test(p))).map(({ mark, tint }) => ({ mark, tint }));
}
