/**
 * Shared typography classes for article/review/guide body content.
 * Covers every element the Filament RichEditor can produce:
 * h2, h3, bold, italic, underline, strike, links, blockquote,
 * bullet/ordered lists, code block, tables, images/attachments, alignment.
 *
 * Keep this in one place so all detail views render content identically.
 */
export const ARTICLE_PROSE = `prose prose-invert max-w-none break-words
    prose-p:text-[var(--ink-mid,#B8B8C0)] prose-p:leading-[1.85] prose-p:text-[16.5px] prose-p:my-5 prose-p:break-words
    prose-a:break-words

    prose-headings:font-display prose-headings:text-white prose-headings:tracking-tight prose-headings:scroll-mt-[140px]
    prose-h2:text-[26px] md:prose-h2:text-[30px] prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-5 prose-h2:pl-4 prose-h2:border-l-4 prose-h2:border-[var(--accent)] prose-h2:leading-tight
    prose-h3:text-[20px] md:prose-h3:text-[23px] prose-h3:font-bold prose-h3:mt-10 prose-h3:mb-4 prose-h3:leading-snug

    prose-a:text-[var(--accent)] prose-a:font-medium prose-a:underline prose-a:decoration-[var(--accent)]/40 prose-a:underline-offset-4
    hover:prose-a:decoration-[var(--accent)] hover:prose-a:text-[var(--accent-hover)] prose-a:transition-colors

    prose-strong:text-white prose-strong:font-semibold
    prose-em:italic

    prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-[18px] prose-blockquote:text-[color:rgba(255,255,255,0.85)] prose-blockquote:leading-relaxed
    prose-blockquote:bg-[var(--surface-1)] prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)]
    prose-blockquote:rounded-r-[var(--radius-panel)] prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-8
    [&_blockquote_p]:my-2 [&_blockquote_p]:text-[color:rgba(255,255,255,0.85)]

    prose-ul:list-disc prose-ul:pl-6 prose-ul:my-5 prose-ul:text-[var(--ink-mid,#B8B8C0)]
    prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-5 prose-ol:text-[var(--ink-mid,#B8B8C0)]
    prose-li:my-2 prose-li:pl-1 prose-li:leading-[1.75]
    prose-li:marker:text-[var(--accent)] prose-li:marker:font-bold

    prose-code:bg-[var(--surface-1)] prose-code:text-[var(--accent)] prose-code:px-2 prose-code:py-0.5 prose-code:rounded-[var(--radius-inner)] prose-code:font-mono prose-code:text-[14px] prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-[var(--surface-1)] prose-pre:border prose-pre:border-[var(--line)] prose-pre:rounded-[var(--radius-panel)] prose-pre:p-5 prose-pre:my-8 prose-pre:text-[14px] prose-pre:leading-relaxed
    [&_pre_code]:bg-transparent [&_pre_code]:text-[color:rgba(255,255,255,0.85)] [&_pre_code]:p-0

    prose-img:rounded-[var(--radius-panel)] prose-img:border prose-img:border-[var(--line)] prose-img:my-8 prose-img:mx-auto prose-img:block prose-img:max-w-full prose-img:h-auto
    [&_figure]:my-8 [&_figure]:text-center
    [&_figcaption]:text-[13px] [&_figcaption]:text-[color:rgba(255,255,255,0.35)] [&_figcaption]:mt-3 [&_figcaption]:italic

    prose-table:my-0 prose-table:w-full prose-table:text-[14px] prose-table:border-collapse
    prose-thead:border-b prose-thead:border-[var(--line)]
    prose-th:bg-[var(--surface-1)] prose-th:text-white prose-th:font-bold prose-th:uppercase prose-th:tracking-wider prose-th:text-[11px] prose-th:px-4 prose-th:py-3 prose-th:text-left
    prose-td:px-4 prose-td:py-3 prose-td:text-[var(--ink-mid,#B8B8C0)] prose-td:border-b prose-td:border-[var(--line)]
    prose-tr:border-0 [&_tbody_tr:last-child_td]:border-b-0
    [&_.overflow-x-auto]:border [&_.overflow-x-auto]:border-[var(--line)] [&_.overflow-x-auto]:rounded-[var(--radius-panel)] [&_.overflow-x-auto]:my-8

    prose-hr:border-[var(--line)] prose-hr:my-10

    [&_u]:underline [&_u]:underline-offset-4 [&_u]:decoration-white/40
    [&_s]:opacity-60

    [&_iframe]:max-w-full [&_iframe]:border-0 [&_iframe]:rounded-[var(--radius-panel)]
    [&_.embed-container]:my-8
    [&_p:has(iframe)]:my-0 [&_p:has(iframe)]:leading-none
    [&_.twitter-tweet]:mx-auto [&_.twitter-tweet]:my-8
    [&_.instagram-media]:mx-auto [&_.instagram-media]:my-8
    [&_.fb-post]:mx-auto [&_.fb-post]:my-8`;

/**
 * Cut an article body in two so an ad can sit between the halves.
 *
 * AdSense's in-article unit is only allowed between paragraphs of running
 * text, and the only way to get there when the body arrives as one HTML blob
 * is to split the blob. The cut lands on a `</p>` boundary, never inside a
 * heading, a list or a table — anywhere else and the ad would appear mid
 * sentence or, worse, inside an element it would break.
 *
 * Short pieces come back untouched. A news item of four paragraphs with an ad
 * halfway through is an ad with an article around it, which is both a bad read
 * and the thing AdSense's own policy on content-to-ad balance is about.
 *
 * @returns `[before, after]` — `after` is null when the body is too short.
 */
export function splitForAd(html: string, minParagraphs = 6): [string, string | null] {
    if (!html) return [html, null];

    const ends: number[] = [];
    const close = /<\/p>/gi;
    let match: RegExpExecArray | null;
    while ((match = close.exec(html)) !== null) ends.push(match.index + match[0].length);

    if (ends.length < minParagraphs) return [html, null];

    // Halfway, but never before the third paragraph: an ad above the point
    // where the piece has said anything is an ad in front of the article.
    const at = ends[Math.max(2, Math.floor(ends.length / 2) - 1)];

    return [html.slice(0, at), html.slice(at)];
}

/**
 * An excerpt, ended like a sentence rather than mid-word.
 *
 * The API serves excerpts cut to exactly 200 characters, so the last word is
 * usually half a word — and the article templates set the excerpt inside
 * quotation marks, which turned every pull quote into `…that dictated t”`.
 *
 * Only touched when it looks cut: an excerpt that ends in real punctuation is
 * somebody's finished sentence and gets left alone.
 */
export function tidyExcerpt(text: string | null | undefined): string {
    const s = (text ?? "").trim();
    if (!s) return "";
    if (/[.!?…"'”’)]$/.test(s)) return s;

    // Back up to the last word boundary; if there isn't one, the whole thing
    // is a single long token and there is nothing sensible to trim to.
    const cut = s.replace(/\s+\S*$/, "");
    return (cut.length > 40 ? cut : s).replace(/[,;:\-–—]$/, "") + "…";
}
