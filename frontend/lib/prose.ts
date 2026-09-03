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
 * Typography for documents rather than for articles.
 *
 * Same job as ARTICLE_PROSE above, different register. An article body opens
 * with a 30px headline behind an accent bar because it is being read for
 * pleasure; a document is being read to find one thing.
 *
 * ── Two registers, one set of parts ──────────────────────────────────────
 *
 * The legal documents and the help centre want the same *materials* — the same
 * link colour, the same table, the same code chip — and different **sizes**. A
 * privacy clause is scanned for a phrase and is set small and dense; a help
 * answer is read while somebody follows it, and 14px uppercase headings turn
 * "unplug it and plug it back in" into a legal notice.
 *
 * So the shared part is a list and each register adds its own sizes to it.
 * Appending overrides to a finished string would not have worked: two Tailwind
 * utilities for the same property have the same specificity, so which one wins
 * depends on their order in the compiled stylesheet rather than on the order
 * they appear in the class attribute. That is the kind of bug that renders
 * correctly on your machine and wrong after an unrelated build.
 *
 * The bottom half of this list is why it exists at all. DOC_PROSE covered
 * headings, paragraphs, list items, strong and links, and nothing else — so
 * the ten help answers that carry a table drew it in Tailwind's own greys,
 * off the site's palette entirely, and code, quotes and rules were bare.
 */
const DOC_SHARED = [
    "prose prose-invert max-w-none break-words",

    "prose-headings:font-display prose-headings:text-[var(--ink-hi)]",
    "prose-strong:text-[var(--ink-hi)] prose-strong:font-semibold",
    "prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4",

    // Bullets in the accent. The one place a list gets any colour, and it is
    // what makes a set of steps read as steps.
    "prose-li:marker:text-[var(--accent)]",
    "prose-ul:pl-5 prose-ol:pl-5",

    "prose-code:bg-[var(--surface-2)] prose-code:text-[var(--ink-hi)] prose-code:border prose-code:border-[var(--line)]",
    "prose-code:rounded-[var(--radius-inner)] prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal",
    "prose-code:before:content-none prose-code:after:content-none",
    "prose-pre:bg-[var(--surface-2)] prose-pre:border prose-pre:border-[var(--line)] prose-pre:rounded-[var(--radius-panel)]",

    "prose-blockquote:not-italic prose-blockquote:border-l-2 prose-blockquote:border-[var(--accent)]",
    "prose-blockquote:pl-4 prose-blockquote:text-[var(--ink-mid)]",

    "prose-hr:border-[var(--line)] prose-hr:my-8",
    "prose-img:rounded-[var(--radius-panel)] prose-img:border prose-img:border-[var(--line)]",

    /*
     * Tables, and the scroll that keeps them from taking the page with them.
     *
     * `display:block` on the table is what makes overflow-x work on it at all;
     * without it a wide table pushes the whole body sideways on a phone and
     * the reader loses the left edge of every line.
     */
    "[&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:my-6",
    "prose-th:text-left prose-th:font-display prose-th:text-[10.5px] prose-th:font-black",
    "prose-th:uppercase prose-th:tracking-[0.12em] prose-th:text-[var(--ink-low)]",
    "prose-th:border-b prose-th:border-[var(--line-strong)] prose-th:pb-2 prose-th:pr-5",
    "prose-td:border-b prose-td:border-[var(--line)] prose-td:py-2.5 prose-td:pr-5",
    "prose-td:text-[var(--ink-mid)] prose-td:tabular-nums",
];

/**
 * Privacy, Terms, Cookies and Impressum — small, dense, uppercase headings.
 *
 * This is what lived privately inside LegalLayout, which made it the site's
 * second set of prose tokens with no name and no way to reach it.
 */
export const DOC_PROSE = [
    ...DOC_SHARED,
    "prose-headings:uppercase prose-headings:tracking-wide",
    "prose-h2:text-[15px] prose-h2:mt-10 prose-h2:mb-3",
    "prose-h3:text-[13px] prose-h3:mt-6 prose-h3:mb-2",
    "prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-[var(--ink-mid)]",
    "prose-li:text-[14px] prose-li:text-[var(--ink-mid)] prose-li:my-1",
].join(" ");

/**
 * A help answer, which is read rather than referred to.
 *
 * Bigger, looser, and its headings are left in the case they were written in.
 * "If it never finishes" is a signpost through a set of instructions; setting
 * it in 15px uppercase turns a troubleshooting step into a subsection of a
 * contract, which is the register the reader is least able to use while
 * something is broken.
 */
export const HELP_PROSE = [
    ...DOC_SHARED,
    "prose-h2:text-[17.5px] prose-h2:font-bold prose-h2:mt-9 prose-h2:mb-2.5 prose-h2:leading-snug",
    "prose-h3:text-[14.5px] prose-h3:font-bold prose-h3:mt-7 prose-h3:mb-2",
    "prose-p:text-[15.5px] prose-p:leading-[1.72] prose-p:text-[var(--ink-mid)] prose-p:my-4",
    "prose-li:text-[15.5px] prose-li:leading-[1.65] prose-li:text-[var(--ink-mid)] prose-li:my-1.5",
].join(" ");

/**
 * Block elements a paragraph can be *inside*.
 *
 * A `</p>` within one of these is not a gap between paragraphs — it is a cell
 * in a table or an item in a list, and cutting there tears the element in two.
 */
const CONTAINERS = 'table|thead|tbody|tfoot|tr|td|th|ul|ol|li|dl|blockquote|figure|pre|aside|details';

const BOUNDARY = new RegExp(`<(/?)(?:${CONTAINERS})\\b[^>]*>|</p\\s*>`, 'gi');

/**
 * Cut an article body in two so an ad can sit between the halves.
 *
 * AdSense's in-article unit is only allowed between paragraphs of running
 * text, and the only way to get there when the body arrives as one HTML blob
 * is to split the blob.
 *
 * The cut has to land between top-level paragraphs, and this used to take any
 * `</p>` at all. Tables are made of paragraphs: the editor writes
 * `<td><p>Silent Hill: Townfall</p></td>`, so a release-date table of
 * twenty-four rows carries forty-eight of them. On the Gamescom 2026 piece
 * that was 48 of the body's 64 — the halfway mark landed inside the table, the
 * ad was dropped into the middle of it, and everything after the cut lost its
 * `<table>` wrapper and rendered as a column of loose text.
 *
 * So the scan tracks whether it is inside a block element and only counts the
 * paragraph ends that are not. A body that is mostly table now reads as the
 * handful of paragraphs it actually is, and comes back uncut when that is
 * fewer than `minParagraphs`.
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
    let depth = 0;

    BOUNDARY.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = BOUNDARY.exec(html)) !== null) {
        const isParagraphEnd = match[1] === undefined;

        if (isParagraphEnd) {
            if (depth === 0) ends.push(match.index + match[0].length);
            continue;
        }

        // A stray closing tag must not drive the depth negative — malformed
        // markup would then make every later `</p>` look top-level again.
        depth = match[1] === '/' ? Math.max(0, depth - 1) : depth + 1;
    }

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
