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

    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
