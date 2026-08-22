/**
 * Where a shelf entry came from, as a mark small enough to live on a cover.
 *
 * A library can arrive from three places and, once imported, every entry looked
 * identical — the cover said what the game was and nothing said where it came
 * from. `user_games.platform` has carried the answer for Xbox and PlayStation
 * since those imports were written; Steam started writing it too.
 *
 * Monochrome on purpose. A card already carries a status colour on its top edge
 * and in its pill, and a green Xbox mark beside a blue Backlog pill is a third
 * hue arguing for attention that provenance does not deserve. It inherits the
 * colour of the line it sits on, which is where metadata belongs.
 */

const PATHS: Record<string, { d: string; box: string; label: string }> = {
    steam: {
        label: "Steam",
        box: "0 0 233 233",
        d: "M116.5 28C68.1 28 28 68.1 28 116.5c0 43.5 30.7 79.9 71.7 88.5l26.4-65.3a27.3 27.3 0 01-6.1.7c-15.1 0-27.3-12.2-27.3-27.3s12.2-27.3 27.3-27.3 27.3 12.2 27.3 27.3c0 .8 0 1.5-.1 2.3l-64.2 26.6c2.4 6.6 6.5 12.5 11.9 17l65.8-27.3a27.3 27.3 0 003.8-13.3c0-15.1-12.2-27.3-27.3-27.3zM87.3 144.7l-12.2 5.1c2.3 4.6 6.5 8.2 11.7 9.7 10.6 3 21.5-3.2 24.5-13.8 3-10.6-3.2-21.5-13.8-24.5-5.5-1.5-11.1-.7-15.7 2.1l12.6 5.2a9.1 9.1 0 11-7.1 16.2z",
    },
    xbox: {
        label: "Xbox",
        box: "0 0 24 24",
        d: "M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912A11.942 11.942 0 0 0 24 12.004a11.95 11.95 0 0 0-3.57-8.536s-.027-.022-.082-.042a.847.847 0 0 0-.281-.045c-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042A11.956 11.956 0 0 0 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245a.725.725 0 0 0-.281.045zM12 4.958S9.055 3.233 6.755 3.152c-.905-.033-1.454.295-1.52.335C7.379 1.996 9.659 0 12 0h.016c2.341 0 4.615 1.996 6.762 3.487-.065-.04-.611-.368-1.518-.335-2.3.081-5.244 1.8-5.26 1.806z",
    },
    playstation: {
        label: "PlayStation",
        box: "0 0 24 24",
        d: "M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.499v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.06 1.472 1.588 2.072-.473.601-1.622 1.03-1.622 1.03l-8.536 3.079v-2.276zM1.807 18.867c-1.9-.535-2.213-1.65-1.348-2.29.802-.594 2.16-1.04 2.16-1.04l5.626-2.003v2.286l-4.05 1.45c-.715.257-.826.62-.246.813.586.192 1.637.14 2.352-.117l1.944-.705v2.045c-.124.02-.26.04-.386.06-1.939.318-4.004.187-6.052-.5z",
    },
};

/**
 * `platform` is a free-text column — the imports write "Steam", "Xbox" and
 * "PlayStation", but a reader can type their own, and "PS5" or "Xbox Series X"
 * should still find its family.
 */
function resolve(platform: string | null | undefined) {
    const value = (platform ?? "").toLowerCase();

    if (!value) return null;
    if (value.includes("steam")) return PATHS.steam;
    if (value.includes("xbox")) return PATHS.xbox;
    if (value.includes("playstation") || value.startsWith("ps")) return PATHS.playstation;

    return null;
}

export default function PlatformMark({
    platform,
    size = 11,
    className = "",
}: {
    platform: string | null | undefined;
    size?: number;
    className?: string;
}) {
    const mark = resolve(platform);

    if (!mark) return null;

    return (
        <svg
            viewBox={mark.box}
            width={size}
            height={size}
            fill="currentColor"
            role="img"
            aria-label={`From ${mark.label}`}
            className={`shrink-0 ${className}`}
        >
            <title>{`From ${mark.label}`}</title>
            <path d={mark.d} />
        </svg>
    );
}
