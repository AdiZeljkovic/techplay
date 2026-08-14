/**
 * The five marks for the bottom tab bar.
 *
 * Drawn here rather than supplied as art, which is the exception on this site
 * and needs a reason: every other icon set — the menu, the shelves, the boards
 * — is hand-made raster, and raster is wrong for exactly this job. A tab has
 * two states, and painted red line art cannot go quiet when the tab is not the
 * one you are on; dimming it with opacity greys the whole mark, including the
 * parts that carried its shape. These inherit `currentColor`, so the bar tints
 * them and the active one lights up without a second file.
 *
 * They are also drawn at the size they are used. 24px is four or five strokes
 * wide — the shelf icons scaled down to it turn to mush, which is the same
 * lesson the profile set already learned at 60px.
 *
 * House language: angular, flat-ended strokes, no curves where a cut will do.
 * A 24 viewBox with 1.75 stroke lands on the pixel grid at 1× and stays sharp
 * at 2× and 3×.
 */

interface MarkProps {
    className?: string;
    /** Filled marks read heavier; the active tab uses it as a second signal. */
    active?: boolean;
}

const S = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
};

function Svg({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
            {children}
        </svg>
    );
}

/** Home — a roof over a hearth, cut square in the house manner. */
export function HomeMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M3.5 10.2 12 3.5l8.5 6.7V20H3.5z" />
            <path {...S} d="M9.4 20v-5.6h5.2V20" fill={active ? "currentColor" : "none"} />
        </Svg>
    );
}

/**
 * Feed — three plates of the same weight, stacked.
 *
 * They have to be equal: drawn at different heights the middle one reads as a
 * mistake at 24px rather than as depth. The active state fills the top plate,
 * which is the only part of the mark with room to carry a fill that small.
 */
export function FeedMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M4.2 5.4h15.6v4H4.2z" fill={active ? "currentColor" : "none"} />
            <path {...S} d="M4.2 12h15.6v4H4.2z" />
            <path {...S} d="M4.2 18.6h15.6" />
        </Svg>
    );
}

/**
 * Games — a pad reduced to its silhouette: sloped shoulders, a cross, two keys.
 *
 * The keys are drawn as short bars rather than dots. Dots at this size are a
 * pixel and a half across and disappear into the stroke around them; the first
 * cut of this mark lost them entirely on the contact sheet.
 */
export function GamesMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M7.2 7.4h9.6l2.8 9.2H4.4z" fill={active ? "currentColor" : "none"} />
            <path {...S} stroke={active ? "var(--surface-0)" : "currentColor"} d="M8 11.9h3.2M9.6 10.3v3.2" />
            <path {...S} stroke={active ? "var(--surface-0)" : "currentColor"} d="M13.6 10.6h2.2M14.8 13.4h2.2" />
        </Svg>
    );
}

/** Forum — two panels talking, the smaller one answering. */
export function ForumMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M3.5 5h12.2v8.4H8.2L4.7 16.6v-3.2H3.5z" fill={active ? "currentColor" : "none"} />
            <path {...S} d="M18.2 8.6h2.3v7.6h-1.2v2.8l-3-2.8h-4" />
        </Svg>
    );
}

/** Profile — the player, shoulders squared like the rank plates. */
export function ProfileMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M8.4 4.4h7.2v6.2H8.4z" fill={active ? "currentColor" : "none"} />
            <path {...S} d="M4.6 20.4v-2.9l3.4-2.6h8l3.4 2.6v2.9z" />
        </Svg>
    );
}

/**
 * Everything the five tabs do not carry.
 *
 * Three dots, not three lines. Lines were the first draft and they collided
 * with Feed's stacked plates at 24px — two marks made of horizontal bars, side
 * by side on the same screen, is a reader guessing. Dots share nothing with
 * any other mark in the set.
 */
export function MoreMark({ className }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} strokeWidth={2.6} strokeLinecap="round" d="M6 12h.01M12 12h.01M18 12h.01" />
        </Svg>
    );
}
