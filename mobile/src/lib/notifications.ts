import { api } from '@/lib/api';
import { getPage, type Paged } from '@/lib/paging';

/**
 * In-app notifications, the same four routes the site's header uses.
 *
 * The shape is the backend presenter's, not invented here: `NotificationController::present()`
 * hands back id, type, title, message, link, icon_path, is_read, created_at —
 * and `link` is a site path, which is why opening one has to be translated
 * rather than followed.
 */
export interface Notification {
    id: string;
    type: string;
    title: string | null;
    message: string | null;
    /** A path on techplay.gg — `/news/some-slug`, `/forum/thread/12`. */
    link: string | null;
    icon_path: string | null;
    is_read: boolean;
    created_at: string | null;
}

export interface NotificationCounts {
    unread_messages: number;
    pending_requests: number;
    unread_notifications: number;
    total: number;
}

/**
 * The badge number.
 *
 * A separate, cheap call from the list on purpose: the header needs a count on
 * every launch and the list only when somebody opens the bell. Fetching twenty
 * rows to render one digit would be the whole payload for none of it.
 */
export async function getCounts(signal?: AbortSignal): Promise<NotificationCounts> {
    return api<NotificationCounts>('/user/notifications/counts', { signal });
}

export async function getNotifications(signal?: AbortSignal): Promise<Paged<Notification>> {
    return getPage<Notification>('/notifications', signal, true);
}

export async function markRead(id: string): Promise<void> {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllRead(): Promise<void> {
    await api('/notifications/read-all', { method: 'POST' });
}

/**
 * Where a notification's `link` goes in the app.
 *
 * The server writes web paths, because for four years the only client was the
 * website. Most of them have no screen here yet — a forum thread, a friend
 * request, an order — and following one blindly would push a route that does
 * not exist and leave somebody on a blank screen with a back button.
 *
 * So this translates the ones the app can honestly serve and returns null for
 * the rest, which the sheet then draws as read-only text rather than as
 * something tappable. A row that does nothing is better than a row that
 * promises and fails; when those screens land, they get added here.
 */
export function routeFor(link: string | null): string | null {
    if (!link) { return null; }

    const path = link.replace(/^https?:\/\/[^/]+/, '');

    const article = path.match(/^\/(news|reviews|hardware|guides|videos)\/([^/?#]+)/);

    if (article) { return `/news/${article[2]}`; }

    const game = path.match(/^\/games\/([^/?#]+)/);

    if (game) { return `/games/${game[1]}`; }

    if (/^\/(profile|settings)/.test(path)) { return '/(tabs)/profile'; }
    if (/^\/calendar/.test(path)) { return '/(tabs)/calendar'; }

    return null;
}
