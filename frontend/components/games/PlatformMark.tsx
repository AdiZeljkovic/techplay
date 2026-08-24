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
    /*
     * The real mark, not the tracing that was here first.
     *
     * The previous path drew the disc and the valve as one filled shape, which
     * works when it sits white on Steam's own dark circle and collapses into a
     * blob the moment it is asked to be a single colour. This one is the
     * official monochrome glyph — the valve reads as negative space inside the
     * disc, at any size and in any colour.
     */
    steam: {
        label: "Steam",
        box: "0 0 24 24",
        d: "M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z",
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
    /*
     * GOG's mark is a wordmark, not a glyph — there is no single shape that
     * reads as "GOG" the way the Steam disc or the PlayStation column do. So
     * this draws the letters, which is what GOG itself puts on a button.
     */
    gog: {
        label: "GOG",
        box: "0 0 48 24",
        d: "M8.4 4.8C4.6 4.8 2 7.6 2 12s2.6 7.2 6.4 7.2h5.2v-7.6H9.1v2.8h1.7v2H8.6c-2 0-3.2-1.5-3.2-4.4s1.2-4.4 3.2-4.4h5V4.8H8.4zm14 0C18.6 4.8 16 7.6 16 12s2.6 7.2 6.4 7.2h1.9c3.8 0 6.4-2.8 6.4-7.2s-2.6-7.2-6.4-7.2h-1.9zm.2 2.8h1.5c2 0 3.2 1.5 3.2 4.4s-1.2 4.4-3.2 4.4h-1.5c-2 0-3.2-1.5-3.2-4.4s1.2-4.4 3.2-4.4zm16.2-2.8C35 4.8 32.4 7.6 32.4 12s2.6 7.2 6.4 7.2H44v-7.6h-4.5v2.8h1.7v2H39c-2 0-3.2-1.5-3.2-4.4s1.2-4.4 3.2-4.4h5V4.8h-5.2z",
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
    if (value.includes("gog")) return PATHS.gog;

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
