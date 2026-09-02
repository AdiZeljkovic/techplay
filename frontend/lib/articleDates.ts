/**
 * When an article was published, said the way a crawler needs to hear it.
 *
 * Google News is a freshness surface: the date is not decoration on an article
 * page, it is the field the whole ranking turns on. Its technical guidelines
 * ask that "article headlines and publication times are easily identifiable by
 * our automated crawler", and Googlebot-News is documented as poor at
 * JavaScript — so a date that only exists after hydration is a date the news
 * crawler may never read.
 *
 * Two things were wrong, and this file exists so neither can come back in one
 * of the four places that emit these dates.
 */

/**
 * The timezone the site publishes in.
 *
 * A fixed zone rather than the reader's, because this string is rendered once
 * on the server and again in the browser and the two must agree exactly. Left
 * to local time, a reader in Sydney hydrates a different day than the server
 * wrote and React discards the markup — which is why the date was pushed into
 * an effect in the first place, and why it stopped reaching the crawler.
 */
const PUBLISHING_TZ = "Europe/Sarajevo";

const DISPLAY = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: PUBLISHING_TZ,
});

/** `01/09/2026`, identical on both sides of hydration. Empty for a bad date. */
export function formatArticleDate(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : DISPLAY.format(d);
}

interface Dated {
    published_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

/**
 * The pair of dates for NewsArticle structured data.
 *
 * `dateModified` was `updated_at` alone, and that produced articles claiming to
 * have been modified before they were published — eight minutes before, on the
 * piece that prompted this. It happens whenever a draft is written and then
 * published later: `published_at` moves forward and `updated_at` does not.
 *
 * A modification that precedes publication is not a small inconsistency to a
 * crawler deciding how much to trust a timestamp. Where the two disagree, the
 * publication date is the one that is true, so it stands in for both.
 */
export function articleDates(article: Dated): { published: string; modified: string } {
    const published = article.published_at || article.created_at || "";
    const updated = article.updated_at || "";

    if (!published) return { published: updated, modified: updated };
    if (!updated) return { published, modified: published };

    const modified = new Date(updated) >= new Date(published) ? updated : published;

    return { published, modified };
}
