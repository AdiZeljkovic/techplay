/**
 * The marks for the boards we run.
 *
 * They were painted emoji: a red megaphone, a blue question balloon, a green
 * mug, a gold star and two purple controllers — seven pictures from four
 * different drawing traditions, and two of them the same controller. Beside
 * the quick links and the database shelves, which are one crimson line-art
 * family, the forum read as somebody else's site.
 *
 * These are drawn on the same 24 grid at one weight with round joins, so a
 * board sits in the same family as everything else. They take `currentColor`,
 * which means the per-board tint in lib/forum keeps working — the colour is
 * the board's, the hand is the house's.
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

/** News & Announcements — a megaphone, mid-shout. */
export function MegaphoneMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <path d="M3.4 9.5h3.1l9-4.2a.85.85 0 0 1 1.2.77v11.86a.85.85 0 0 1-1.2.77l-9-4.2H3.4A1.4 1.4 0 0 1 2 13.07v-2.14A1.4 1.4 0 0 1 3.4 9.5Z" />
            <path d="M6.9 14.5v3.2a1.8 1.8 0 0 0 1.8 1.8h.4a1.8 1.8 0 0 0 1.8-1.8v-1.7" />
            <path d="M19.9 9.4a3.6 3.6 0 0 1 0 5.2" />
        </Svg>
    );
}

/** Feedback & Support — the question actually gets asked. */
export function SupportMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <path d="M4 4.6h16a1.7 1.7 0 0 1 1.7 1.7v8.2a1.7 1.7 0 0 1-1.7 1.7h-7.7L8.6 19.9v-3.7H4a1.7 1.7 0 0 1-1.7-1.7V6.3A1.7 1.7 0 0 1 4 4.6Z" />
            <path d="M9.85 9.1a2.2 2.2 0 1 1 2.9 2.1c-.62.22-.95.7-.95 1.33v.36" />
            <path d="M11.8 15.05h.01" />
        </Svg>
    );
}

/** The Lounge — off topic, and a cup of something. */
export function LoungeMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <path d="M4 9.1h11.4v5.6a4.4 4.4 0 0 1-4.4 4.4H8.4A4.4 4.4 0 0 1 4 14.7V9.1Z" />
            <path d="M15.4 10.5h1.9a2.7 2.7 0 0 1 0 5.4h-1.9" />
            <path d="M7.4 6.2c0-1 1-1.3 1-2.3" />
            <path d="M11 6.2c0-1 1-1.3 1-2.3" />
        </Svg>
    );
}

/** General Gaming — the pad itself. */
export function PadMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <path d="M8.4 7.9h7.2a5.5 5.5 0 0 1 5.42 4.55l.5 2.85a2.55 2.55 0 0 1-4.6 1.93L15.6 15.2H8.4l-1.32 2.03a2.55 2.55 0 0 1-4.6-1.93l.5-2.85A5.5 5.5 0 0 1 8.4 7.9Z" />
            <path d="M6.9 11.4v2.3M5.75 12.55h2.3" />
            <path d="M16.35 11.7h.01M18.15 13.3h.01" />
        </Svg>
    );
}

/**
 * Game Reviews — a verdict, framed.
 *
 * A bare star with two dashes under it was the first try; the dashes read as
 * an underline rather than as the rest of a rating, and at forty pixels an
 * ambiguous mark is a wrong one. The card contains it and says "a thing that
 * has been rated" without asking anybody to interpret two lines.
 */
export function VerdictMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <rect x="3.2" y="4.2" width="17.6" height="15.6" rx="2.3" />
            <path d="M12 7.3 13.147 10.322 16.375 10.478 13.855 12.503 14.705 15.622 12 13.85 9.295 15.622 10.145 12.503 7.624 10.478 10.853 10.322Z" />
        </Svg>
    );
}

/** PC Builds & Upgrades — the tower, fan and all. */
export function TowerMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <rect x="6.2" y="2.9" width="11.6" height="18.2" rx="2" />
            <circle cx="12" cy="13.9" r="3.2" />
            <path d="M12 13.9h.01" />
            <path d="M9.1 6.2h5.8M9.1 8.4h5.8" />
        </Svg>
    );
}

/**
 * Consoles & Peripherals — the box, not another pad.
 *
 * General Gaming already owns the controller, so this cannot be one; two
 * boards wearing the same mark is what the painted set did. A console on its
 * dock reads as hardware at forty pixels, which a box with a cable curling
 * out of it did not — that came out looking like a speech bubble.
 */
export function ConsoleMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <rect x="2.6" y="5.4" width="18.8" height="5.2" rx="1.8" />
            <path d="M5.9 7.4v1.2" />
            <path d="M18.1 8h.01" />
            <rect x="2.6" y="12.6" width="18.8" height="5.2" rx="1.8" />
            <path d="M9 15.2h6" />
            <path d="M18.1 15.2h.01" />
        </Svg>
    );
}

/** Anything added in the admin panel tomorrow. */
export function BoardMark(props: MarkProps) {
    return (
        <Svg {...props}>
            <path d="M4 4.6h16a1.7 1.7 0 0 1 1.7 1.7v8.2a1.7 1.7 0 0 1-1.7 1.7h-7.7L8.6 19.9v-3.7H4a1.7 1.7 0 0 1-1.7-1.7V6.3A1.7 1.7 0 0 1 4 4.6Z" />
            <path d="M7 9.4h10M7 12.4h6.4" />
        </Svg>
    );
}
