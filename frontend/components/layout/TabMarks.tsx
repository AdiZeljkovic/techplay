/**
 * Two marks the shell draws itself.
 *
 * This file used to hold the whole bottom-tab set — a house with a hearth, a
 * feed card, a pad with grips and keys, two overlapping boards — drawn by hand
 * in an angular language with square caps and miter joins. They were legible,
 * and at the 22px they were actually drawn at they were also too much: three
 * strokes of interior detail inside eleven pixels reads as weight, not as
 * meaning. Thickening them made it worse.
 *
 * The tab bar now draws lucide at 22px and `strokeWidth={1.4}`, which is what
 * the Community and Tools sections of the menu have always done — so the bar
 * and the menu are one set instead of two. What is left here is the pair the
 * header still needs and lucide does not supply in this shape.
 */

interface MarkProps {
    className?: string;
    active?: boolean;
}

const S = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
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
 * More — everything the five tabs do not carry.
 *
 * Three dots, not three lines: a hamburger would say "this is the navigation",
 * which since the tab bar exists it no longer is.
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

/** The notification bell, which fills when something is waiting. */
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
