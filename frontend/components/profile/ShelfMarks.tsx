/**
 * The four marks over the Library ledger.
 *
 * They were Lucide's Library, Trophy, Layers and Bookmark, and two of those
 * are almost all thin stroke and no shape — Library is four hairlines, Layers
 * is three flat parallelograms. Beside the navigation menus, whose marks are
 * simple closed forms carrying real ink, they read as scratches.
 *
 * These are drawn for what they count, and each one has a silhouette you can
 * name from across the room: cases standing on a shelf, a finish flag, a pile
 * leaning where the shelf is upright, a star falling. Same construction as the
 * menu marks — 24 grid, round joins, one weight, currentColor — so they belong
 * to the same family rather than announcing themselves as a different set.
 */

interface MarkProps {
    className?: string;
    strokeWidth?: number;
}

function Svg({ className, strokeWidth = 1.6, children }: MarkProps & { children: React.ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={className}
        >
            {children}
        </svg>
    );
}

/**
 * Total games — two cases on a shelf, the second leaning the way they do.
 *
 * Three narrower cases was the first try and it came out as a bar chart:
 * below about forty pixels the lean disappears and identical uprights are
 * exactly what a chart looks like. Two wide ones carry enough ink to hold the
 * shape, and at that width the tilt is unmistakable.
 */
export function ShelfMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <rect x="3.4" y="4.6" width="7" height="14" rx="1.4" />
            <rect x="12" y="4.6" width="6.4" height="14" rx="1.4" transform="rotate(15 15.2 11.6)" />
            <path d="M2.2 20.9h19.6" />
        </Svg>
    );
}

/** Completed — the flag at the end of it. */
export function FinishMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <path d="M5.2 21.4V3" />
            <path d="M5.2 3.8h13.2l-3.2 4.4 3.2 4.4H5.2z" />
        </Svg>
    );
}

/** Backlog — the same cases, in a pile, with the top one sliding off. */
export function PileMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <rect x="3.6" y="15.6" width="16.8" height="4.2" rx="1.3" />
            <rect x="4.9" y="10.5" width="14.2" height="4.2" rx="1.3" />
            <rect x="6.6" y="5.2" width="11.4" height="4.2" rx="1.3" transform="rotate(-7 12.3 7.3)" />
        </Svg>
    );
}

/** Wishlist — a star, falling, because that is what a wish is. */
export function WishMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <path d="M15.3 2.4 16.8 6.54 21.2 6.68 17.73 9.39 18.95 13.62 15.3 11.15 11.65 13.62 12.87 9.39 9.4 6.68 13.8 6.54Z" />
            <path d="M9.8 14.4 4.6 19.6" />
            <path d="M12.6 17.6 10.2 20" />
        </Svg>
    );
}
