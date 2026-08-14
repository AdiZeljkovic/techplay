/**
 * The marks for the boards we run.
 *
 * Hand-supplied art, not drawn here. They arrived as transparent PNGs and are
 * prepared the way every other icon set on this site is: trimmed to the alpha
 * bounding box, the long edge fitted to 90% of a 256 square, centred. Scaling
 * each one to fill its own square instead would make a wide console tower over
 * a tall PC case — the ragged line the database shelves had before the same
 * fix.
 *
 * They keep the component shape the drawn marks had, so every call site — the
 * board rows, a category header, the sidebar, the create page's board picker —
 * passes a className and gets a square back. The art carries its own colour,
 * so nothing tints it.
 *
 * Consoles gets a console rather than a second controller: General Gaming
 * already owns the pad, and two boards wearing one mark is what the emoji set
 * before this did.
 */

interface MarkProps {
    className?: string;
}

/**
 * Square, and drawn to a square.
 *
 * `object-contain` matters even though the files are square: it is what stops
 * a caller who passes a non-square box from stretching the art.
 */
function Art({ src, className = "" }: { src: string; className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={`/images/forum/${src}.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className={`object-contain select-none pointer-events-none ${className}`}
        />
    );
}

/** News & Announcements. */
export function MegaphoneMark(props: MarkProps) {
    return <Art src="news-announcements" {...props} />;
}

/** Feedback & Support. */
export function SupportMark(props: MarkProps) {
    return <Art src="feedback-support" {...props} />;
}

/** The Lounge — off topic, so the plain board mark. */
export function LoungeMark(props: MarkProps) {
    return <Art src="board" {...props} />;
}

/** General Gaming. */
export function PadMark(props: MarkProps) {
    return <Art src="general-gaming" {...props} />;
}

/** Game Reviews. */
export function VerdictMark(props: MarkProps) {
    return <Art src="game-reviews" {...props} />;
}

/** PC Builds & Upgrades. */
export function TowerMark(props: MarkProps) {
    return <Art src="pc-builds" {...props} />;
}

/** Consoles & Peripherals. */
export function ConsoleMark(props: MarkProps) {
    return <Art src="consoles" {...props} />;
}

/** Anything added in the admin panel tomorrow. */
export function BoardMark(props: MarkProps) {
    return <Art src="board" {...props} />;
}
