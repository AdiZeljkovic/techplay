/**
 * Where an article actually lives.
 *
 * `tech` is served from /hardware; every other category type maps to a segment
 * of the same name. That one exception is the whole reason this function
 * exists, and the whole reason hand-written links keep getting it wrong: a
 * `/news/{slug}` built by hand looks right, works for the two-thirds of the
 * catalogue that really is news, and 404s for the rest.
 *
 * It has cost readers. A tech piece on the author page linked to /news and
 * returned 404 for all 51 of one author's tech articles; the share button on
 * the article page produced the same broken link, which is how one reached
 * Discord with "how am I supposed to read this if it throws an error?".
 *
 * The parameter is a shape rather than the Article type on purpose. The header
 * carries its own trimmed NavArticle and could not pass it, so it grew a
 * private copy of this mapping that knew about reviews and nothing else —
 * which is how the bug came back in a second place.
 */
export function articleHref(article: {
    slug?: string | null;
    category?: { type?: string | null } | null;
}): string {
    if (!article.slug) return "#";
    const type = article.category?.type ?? "news";
    const segment = type === "tech" ? "hardware" : type;
    return `/${segment}/${article.slug}`;
}
