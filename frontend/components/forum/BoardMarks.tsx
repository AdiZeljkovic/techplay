"use client";

import { useId } from "react";

/**
 * The marks for the boards we run.
 *
 * Drawn the way the homepage's quick links are drawn: a subject in the upper
 * left, a second object overlapping it from the lower right, and the subject
 * knocked out behind that object so it reads as in front rather than welded
 * on. That composite is the house idiom — it is what makes a database and a
 * calendar look like they came from one hand.
 *
 * The quick links use a controller as the second object, because the site is
 * about games. A forum board is about people arguing, so the second object
 * here is a speech bubble: the same construction, saying the thing this
 * section actually is. Every board is "this subject, discussed".
 *
 * They are deliberately thin on detail. A megaphone had a handle, a lifebuoy
 * had four spokes, a pad had two face buttons and a tower had vents — true of
 * the objects and invisible at thirty-eight pixels, where every extra stroke
 * only crowds the two shapes that carry the meaning. Two ideas per mark, and
 * the bubble is one of them.
 *
 * Nothing is a painted file. They take `currentColor`, and every board draws
 * them in the house accent: seven colours made a list of boards read as a
 * paint chart rather than a set.
 */

interface MarkProps {
    className?: string;
    strokeWidth?: number;
}

/** The bubble that marks every board, and the hole it punches. */
const BUBBLE = "M14.15 12.6h6.35a1.7 1.7 0 0 1 1.7 1.7v4.3a1.7 1.7 0 0 1-1.7 1.7h-2.6l-2.9 2.25V20.3h-.85a1.7 1.7 0 0 1-1.7-1.7v-4.3a1.7 1.7 0 0 1 1.7-1.7Z";

/**
 * One mark: the subject behind, the bubble in front, and a gap between them.
 *
 * The knockout is a mask rather than a filled shape, because these are drawn
 * on four different surfaces — a board row, a category header, the sidebar
 * and the hero — and a bubble filled with one page's colour is a bubble with
 * the wrong background on the other three.
 */
function Mark({ className, strokeWidth = 1.7, children }: MarkProps & { children: React.ReactNode }) {
    const id = useId();

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
            <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                <rect x="0" y="0" width="24" height="24" fill="#fff" />
                {/* the bubble, fattened — this is the gap you can see around it */}
                <path d={BUBBLE} fill="#000" stroke="#000" strokeWidth={strokeWidth * 2.4} strokeLinejoin="round" />
            </mask>

            <g mask={`url(#${id})`}>{children}</g>

            <path d={BUBBLE} />
            <path d="M16.4 16.45h3.4" />
        </svg>
    );
}

/** News & Announcements — a megaphone, mid-shout. */
export function MegaphoneMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M2.6 7.6h2.6l7.1-3.4a.8.8 0 0 1 1.15.72v9.96a.8.8 0 0 1-1.15.72L5.2 12.2H2.6A1.4 1.4 0 0 1 1.2 10.8V9A1.4 1.4 0 0 1 2.6 7.6Z" />
            {/* The shout sits above the bubble rather than beside it — at the
                old height the knockout ate the arc and left the horn shouting
                at nothing. */}
            <path d="M15.4 5.2a2.6 2.6 0 0 1 0 3.7" />
        </Mark>
    );
}

/** Feedback & Support — the ring you throw to somebody. */
export function SupportMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <circle cx="9.9" cy="9.9" r="7.7" />
            <circle cx="9.9" cy="9.9" r="3.4" />
        </Mark>
    );
}

/** The Lounge — off topic, and a cup of something. */
export function LoungeMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M2 7.7h10.9v5.5a4.3 4.3 0 0 1-4.3 4.3H6.3A4.3 4.3 0 0 1 2 13.2V7.7Z" />
            <path d="M12.9 9.1h1.8a2.6 2.6 0 0 1 0 5.2h-1.8" />
            <path d="M7.3 5.1c0-1.1 1.1-1.4 1.1-2.5" />
        </Mark>
    );
}

/** General Gaming — the pad itself. */
export function PadMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M6.8 5h6.3a4.9 4.9 0 0 1 4.83 4.05l.43 2.45a2.25 2.25 0 0 1-4.06 1.7L13.15 11.5H6.75L5.6 13.2a2.25 2.25 0 0 1-4.06-1.7l.43-2.45A4.9 4.9 0 0 1 6.8 5Z" />
            <path d="M5.5 7.9v2.3M4.35 9.05h2.3" />
        </Mark>
    );
}

/** Game Reviews — the verdict, framed. */
export function VerdictMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <rect x="1.9" y="2.4" width="15.4" height="14.2" rx="2.2" />
            <path d="M9.6 5.6 10.72 8.55 13.87 8.7 11.41 10.68 12.24 13.73 9.6 12.04 6.96 13.73 7.79 10.68 5.33 8.7 8.48 8.55Z" />
        </Mark>
    );
}

/** PC Builds & Upgrades — the tower, fan and all. */
export function TowerMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <rect x="3.4" y="1.8" width="11" height="16.6" rx="2.1" />
            <circle cx="8.9" cy="11.3" r="3" />
            <path d="M6.5 5.4h4.8" />
        </Mark>
    );
}

/** Consoles & Peripherals — the box, not another pad. */
export function ConsoleMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <rect x="1.6" y="3.9" width="16.8" height="5" rx="1.8" />
            <path d="M15.7 6.4h.01" />
            <rect x="1.6" y="10.9" width="16.8" height="5" rx="1.8" />
            <path d="M15.7 13.4h.01" />
        </Mark>
    );
}

/** Anything added in the admin panel tomorrow. */
export function BoardMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M3.3 2.5h11.4a2.1 2.1 0 0 1 2.1 2.1v8.8a2.1 2.1 0 0 1-2.1 2.1H3.3a2.1 2.1 0 0 1-2.1-2.1V4.6a2.1 2.1 0 0 1 2.1-2.1Z" />
            <path d="M4.7 6.6h8.6M4.7 10.2h5.4" />
        </Mark>
    );
}
