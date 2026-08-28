/**
 * Cover art an OG card can actually draw.
 *
 * `ImageResponse` renders through Satori, which decodes PNG, JPEG and SVG —
 * and nothing else. A WebP goes in and a bordered empty rectangle comes out:
 * the frame is drawn, the image never arrives, and the card ships with a hole
 * in it.
 *
 * That is not an edge case here. 129,911 of the 313,776 covers in the
 * catalogue are WebP — 41% — because MobyGames serves nothing else. Its CDN
 * accepts `.jpg` on the same URL and still answers `image/webp`, so there is
 * no rewrite to reach for; the file simply cannot be drawn.
 *
 * So the filter runs *before* the slice. Taking the first five covers and
 * hoping meant a studio whose newest game came from MobyGames lost a slot;
 * taking the first five drawable ones means a card with 48 games behind it
 * almost always fills.
 *
 * A card with three covers reads fine. A card with three covers and two empty
 * frames reads as broken.
 */

/** Formats Satori cannot decode, by the only signal a URL gives us. */
const UNDRAWABLE = /\.(webp|avif)(\?|$)/i;

export function drawableCovers(urls: unknown[], limit: number): string[] {
    return urls
        .filter((src): src is string => typeof src === "string" && src.startsWith("http"))
        .filter((src) => !UNDRAWABLE.test(src))
        .slice(0, limit);
}

/** A single image — an avatar, a logo — under the same rule. */
export function drawableImage(src: unknown): string | null {
    if (typeof src !== "string" || !src.startsWith("http") || UNDRAWABLE.test(src)) {
        return null;
    }

    return src;
}
