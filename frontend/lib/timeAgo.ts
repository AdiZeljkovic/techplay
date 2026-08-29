/**
 * The one relative-time helper. Deliberately coarse — a dashboard card cares
 * about "3d ago", never "3 days, 4 hours and 12 minutes ago".
 */
/** "Resets in 6d" / "4h left" — deadlines are what make a quest a quest. */
export function timeLeft(iso: string | null): string | null {
    if (!iso) return null;

    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms) || ms <= 0) return null;

    const hours = Math.floor(ms / 3_600_000);
    if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
    if (hours < 24) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d left`;
}

export function timeAgo(iso: string | null): string {
    if (!iso) return "";

    const days = Math.floor((Date.now() - parse(iso)) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

/**
 * The same thing at reading speed, for feeds.
 *
 * A live feed wants "just now" and "5 min ago"; a dashboard card does not, and
 * that is why there are two of these rather than one with an option. What there
 * should not be is four: this existed twice over, copied into FeedClient and
 * SectionHub, and the two copies had already drifted apart — one said "just
 * now" for a fresh item and the other "1 min ago", and only one of them knew
 * that the API sometimes sends a timestamp with a space instead of a T.
 */
export function timeAgoDetailed(iso?: string | null): string | null {
    if (!iso) return null;

    const mins = Math.floor((Date.now() - parse(iso)) / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)} h ago`;

    const days = Math.floor(mins / 1440);

    return days < 30 ? `${days} d ago` : shortDate(iso);
}

/** "4 Aug 2026". Null in, null out, so a missing date renders as nothing. */
export function shortDate(iso?: string | null): string | null {
    if (!iso) return null;

    return new Date(parse(iso)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Milliseconds from whatever the API sent.
 *
 * Laravel serialises most timestamps as ISO-8601, but a few endpoints hand back
 * the database's own `Y-m-d H:i:s`, and Safari refuses that shape outright —
 * it parses to NaN, and every duration computed from it renders as a blank or a
 * nonsense number. Swapping the space for a T costs nothing and covers both.
 */
function parse(iso: string): number {
    return new Date(iso.replace(" ", "T")).getTime();
}
