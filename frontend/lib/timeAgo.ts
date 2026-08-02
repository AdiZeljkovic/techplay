/**
 * The one relative-time helper. Deliberately coarse — a dashboard card cares
 * about "3d ago", never "3 days, 4 hours and 12 minutes ago".
 */
export function timeAgo(iso: string | null): string {
    if (!iso) return "";

    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
