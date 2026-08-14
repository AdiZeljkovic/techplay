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
 * Nothing is a painted file. They take `currentColor`, so the per-board tint
 * in lib/forum keeps working — the colour is the board's, the hand is the
 * house's.
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
            <path d="M16.4 15.55h3.4M16.4 17.6h2" />
        </svg>
    );
}

/** News & Announcements — a megaphone, mid-shout. */
export function MegaphoneMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M2.7 7.5h2.5l6.9-3.25a.78.78 0 0 1 1.1.7v9.6a.78.78 0 0 1-1.1.7L5.2 11.95H2.7A1.3 1.3 0 0 1 1.4 10.65V8.8A1.3 1.3 0 0 1 2.7 7.5Z" />
            <path d="M5.2 11.95v2.75a1.6 1.6 0 0 0 1.6 1.6h.3a1.6 1.6 0 0 0 1.6-1.6v-1.4" />
            {/* The shout sits above the bubble rather than beside it — at the
                old height the knockout ate the arc and left the horn shouting
                at nothing. */}
            <path d="M15.2 4.9a2.7 2.7 0 0 1 0 3.9" />
        </Mark>
    );
}

/** Feedback & Support — the ring you throw to somebody. */
export function SupportMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <circle cx="10.1" cy="10.1" r="7.6" />
            <circle cx="10.1" cy="10.1" r="3.3" />
            <path d="M4.72 4.72 7.76 7.76M15.48 4.72 12.44 7.76M4.72 15.48 7.76 12.44M15.48 15.48 12.44 12.44" />
        </Mark>
    );
}

/** The Lounge — off topic, and a cup of something. */
export function LoungeMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M2.2 7.9h10.6v5.3a4.2 4.2 0 0 1-4.2 4.2H6.4a4.2 4.2 0 0 1-4.2-4.2V7.9Z" />
            <path d="M12.8 9.2h1.7a2.55 2.55 0 0 1 0 5.1h-1.7" />
            <path d="M5.6 5.1c0-1 1-1.3 1-2.3" />
            <path d="M9.2 5.1c0-1 1-1.3 1-2.3" />
        </Mark>
    );
}

/** General Gaming — the pad itself. */
export function PadMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M6.9 5.3h6.1a4.8 4.8 0 0 1 4.73 3.97l.42 2.4a2.2 2.2 0 0 1-3.97 1.66L13.05 11.6H6.85l-1.13 1.73a2.2 2.2 0 0 1-3.97-1.66l.42-2.4A4.8 4.8 0 0 1 6.9 5.3Z" />
            <path d="M5.65 8.35v2.1M4.6 9.4h2.1" />
            <path d="M13.9 8.6h.01M15.5 10.1h.01" />
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
            <rect x="3.6" y="1.9" width="10.6" height="16.4" rx="2" />
            <circle cx="8.9" cy="11.5" r="2.9" />
            <path d="M8.9 11.5h.01" />
            <path d="M6.3 4.7h5.2M6.3 6.8h5.2" />
        </Mark>
    );
}

/** Consoles & Peripherals — the box, not another pad. */
export function ConsoleMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <rect x="1.7" y="4.1" width="16.6" height="4.9" rx="1.7" />
            <path d="M4.7 5.9v1.3" />
            <path d="M15.6 6.55h.01" />
            <rect x="1.7" y="10.9" width="16.6" height="4.9" rx="1.7" />
            <path d="M7 13.35h5" />
            <path d="M15.6 13.35h.01" />
        </Mark>
    );
}

/** Anything added in the admin panel tomorrow. */
export function BoardMark(props: MarkProps) {
    return (
        <Mark {...props}>
            <path d="M3.4 2.6h11.2a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2H3.4a2 2 0 0 1-2-2V4.6a2 2 0 0 1 2-2Z" />
            <path d="M4.6 6.2h8.8M4.6 9.2h5.6M4.6 12h7" />
        </Mark>
    );
}
