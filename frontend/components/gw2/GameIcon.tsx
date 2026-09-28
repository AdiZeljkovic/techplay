import Image from "next/image";

/**
 * One game icon, framed.
 *
 * This is the piece the whole GW2 section was missing. Every payload carried
 * the right numbers and none of them carried a picture, so a tool about a game
 * full of distinctive art rendered as a spreadsheet. The icons were in the same
 * API responses the whole time.
 *
 * `unoptimized` on purpose, and not an oversight to tidy up later:
 * render.guildwars2.com is ArenaNet's CDN, the files are already small square
 * PNGs, and running them through `/_next/image` would cost us transform budget
 * to re-encode somebody else's thumbnails. The site-wide convention is the
 * same — our uploads are optimized, everyone else's are passed through.
 *
 * Renders nothing without a `src`. Coverage is good but not total — about 8% of
 * achievements have neither their own icon nor a category with one — and a card
 * that simply has no picture reads better than one with a grey box where a
 * picture should be.
 */

const SIZES = {
    sm: 24,
    md: 36,
    lg: 48,
    xl: 64,
} as const;

/**
 * Rarity colours as the game uses them.
 *
 * Worth being exact about: these are not our palette, and a player reads them
 * faster than they read the word next to them. An ascended ring is pink-red and
 * a legendary is purple, everywhere, including here.
 */
export const RARITY_COLOUR: Record<string, string> = {
    Junk: "#AAAAAA",
    Basic: "#FFFFFF",
    Fine: "#62A4DA",
    Masterwork: "#1A9306",
    Rare: "#FCD00B",
    Exotic: "#FFA405",
    Ascended: "#FB3E8D",
    Legendary: "#4C139D",
};

export default function GameIcon({
    src,
    alt,
    size = "md",
    rarity,
    tone,
    dim = false,
    className = "",
}: {
    src: string | null | undefined;
    /** Empty for decoration beside a label that already names the thing. */
    alt: string;
    size?: keyof typeof SIZES;
    /** Draws the game's own rarity colour as the frame. */
    rarity?: string | null;
    /** An explicit frame colour, for icons that carry no rarity. */
    tone?: string;
    /** Completed things step back rather than disappear. */
    dim?: boolean;
    className?: string;
}) {
    if (!src) {
        return null;
    }

    const px = SIZES[size];
    const border = rarity ? RARITY_COLOUR[rarity] : tone;

    return (
        <span
            className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] ${className}`}
            style={{
                width: px,
                height: px,
                background: "var(--surface-3, #161B24)",
                // A hairline in the item's own colour. Enough to read the
                // rarity at a glance without the frame competing with the art.
                boxShadow: border ? `inset 0 0 0 1px color-mix(in srgb, ${border} 70%, transparent)` : undefined,
                opacity: dim ? 0.45 : 1,
            }}
        >
            <Image src={src} alt={alt} width={px} height={px} unoptimized className="h-full w-full object-cover" />
        </span>
    );
}
