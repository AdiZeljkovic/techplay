/**
 * The marks for the bottom tab bar.
 *
 * Drawn here rather than supplied as art, which is the exception on this site
 * and needs a reason: every other icon set — the menu, the shelves, the boards
 * — is hand-made raster, and raster is wrong for exactly this job. A tab has
 * two states, and painted line art cannot go quiet when the tab is not the one
 * you are on. These inherit `currentColor`, so the bar tints them and the
 * active one lights up without a second file.
 *
 * They are also drawn at the size they are used. 24px is four or five strokes
 * wide; the shelf icons scaled down to it turn to mush, which is the same
 * lesson the profile set already learned at 60px.
 *
 * Second cut. The first was legible but plain — a house, three bars, a pad, two
 * speech panels — and it was judged on a near-black ground it no longer sits
 * on. These are drawn for white-on-crimson and given something to recognise
 * them by: the house has a hearth, the feed is a card rather than a stack of
 * rules, the pad has grips, and the boards overlap the way two people talking
 * do. Each was checked on a contact sheet at 22, 24 and 26px against the bar's
 * own red, both states.
 *
 * House language: angular, flat-ended strokes, no curve where a cut will do.
 * A 24 viewBox with 1.8 stroke lands on the pixel grid at 1× and stays sharp
 * at 2× and 3×.
 */

interface MarkProps {
    className?: string;
    /** The tab you are on. Filled marks read heavier, which is the point. */
    active?: boolean;
}

const S = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
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

/**
 * Home — a roof, a wall, and a lit hearth in the middle of it.
 *
 * The hearth is what stops this reading as the generic house every icon set
 * ships. Filled when active, so the window "lights up" on the tab you are on.
 */
export function HomeMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M3.2 10.4 12 3.4l8.8 7" />
            <path {...S} d="M5.3 11.9V20.4h13.4V11.9" />
            <path {...S} d="M9.6 20.4v-5.1h4.8v5.1z" fill={active ? "currentColor" : "none"} />
        </Svg>
    );
}

/**
 * Feed — a card: a picture block over two lines of headline.
 *
 * The first cut was three equal rules, which is the universal glyph for a list
 * and said nothing about what this list holds. A card is what the feed is made
 * of, and it also stops colliding with More, whose earlier three-line mark was
 * the same shape.
 */
export function FeedMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M3.6 4.4h16.8v15.2H3.6z" />
            <path {...S} d="M6.2 7h11.6v5.4H6.2z" fill={active ? "currentColor" : "none"} />
            <path {...S} d="M6.2 15h11.6M6.2 17.6h7.6" />
        </Svg>
    );
}

/**
 * Games — a pad with grips, drawn as one silhouette.
 *
 * The grips are the whole recognition: without them a rounded box with a cross
 * in it is a radio. The keys are short bars rather than dots — dots at this
 * size are a pixel and a half across and vanish into the stroke beside them,
 * which is exactly what the first cut of this mark did.
 */
export function GamesMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path
                {...S}
                d="M7.6 7.2h8.8l3.4 6.1 1 4.4-3 1.1-3-3.2H9.2l-3 3.2-3-1.1 1-4.4z"
                fill={active ? "currentColor" : "none"}
            />
            <path {...S} stroke={active ? "var(--tab-ground, #DC143C)" : "currentColor"} d="M7 12.4h3.2M8.6 10.8v3.2" />
            <path {...S} stroke={active ? "var(--tab-ground, #DC143C)" : "currentColor"} d="M14 11.4h2M15.4 13.8h2" />
        </Svg>
    );
}

/**
 * Forum — two boards, overlapping, the near one answering the far one.
 *
 * Overlap rather than two panels side by side: side by side reads as two of
 * something, overlapping reads as a conversation.
 */
export function ForumMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M2.8 4.6h13.4v8.2H8.4l-3.6 3.2v-3.2H2.8z" fill={active ? "currentColor" : "none"} />
            <path {...S} d="M18.4 8.4h2.8v7.8h-1.4v3l-3.4-3h-4.6" />
        </Svg>
    );
}

/**
 * Profile — the player, shoulders squared like the rank plates.
 *
 * The tab bar draws the reader's own portrait instead when there is one; this
 * is what a signed-out visitor sees, and it is still used wherever a portrait
 * is not available.
 */
export function ProfileMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path {...S} d="M8.4 4.2h7.2v6.4H8.4z" fill={active ? "currentColor" : "none"} />
            <path {...S} d="M4.4 20.6v-3.1l3.6-2.7h8l3.6 2.7v3.1z" />
        </Svg>
    );
}

/**
 * More — everything the five tabs do not carry.
 *
 * Three dots, not three lines. Lines were the first draft and they collided
 * with the feed mark at 24px; dots share nothing with any other mark here.
 * A hamburger would say "this is the navigation", which since the tab bar
 * exists it no longer is.
 */
export function MoreMark({ className }: MarkProps) {
    return (
        <Svg className={className}>
            <circle cx="5.6" cy="12" r="1.7" fill="currentColor" />
            <circle cx="12" cy="12" r="1.7" fill="currentColor" />
            <circle cx="18.4" cy="12" r="1.7" fill="currentColor" />
        </Svg>
    );
}

/** The notification bell, drawn to match rather than borrowed from lucide. */
export function BellMark({ className, active }: MarkProps) {
    return (
        <Svg className={className}>
            <path
                {...S}
                d="M6 17.4v-5.6a6 6 0 0 1 12 0v5.6l1.6 2.2H4.4z"
                fill={active ? "currentColor" : "none"}
            />
            <path {...S} d="M10.2 20.8a2 2 0 0 0 3.6 0" />
        </Svg>
    );
}
