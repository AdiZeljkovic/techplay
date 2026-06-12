/**
 * Shared typography classes for article/review/guide body content.
 * Covers every element the Filament RichEditor can produce:
 * h2, h3, bold, italic, underline, strike, links, blockquote,
 * bullet/ordered lists, code block, tables, images/attachments, alignment.
 *
 * Keep this in one place so all detail views render content identically.
 */
export const ARTICLE_PROSE = `prose prose-invert max-w-none break-words
    prose-p:text-[#B8B8C0] prose-p:leading-[1.85] prose-p:text-[16.5px] prose-p:my-5 prose-p:break-words
    prose-a:break-words

    prose-headings:font-display prose-headings:text-white prose-headings:tracking-tight prose-headings:scroll-mt-[140px]
    prose-h2:text-[26px] md:prose-h2:text-[30px] prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-5 prose-h2:pl-4 prose-h2:border-l-4 prose-h2:border-tp-accent prose-h2:leading-tight
    prose-h3:text-[20px] md:prose-h3:text-[23px] prose-h3:font-bold prose-h3:mt-10 prose-h3:mb-4 prose-h3:leading-snug

    prose-a:text-tp-accent prose-a:font-medium prose-a:underline prose-a:decoration-tp-accent/40 prose-a:underline-offset-4
    hover:prose-a:decoration-tp-accent hover:prose-a:text-tp-accent-hover prose-a:transition-colors

    prose-strong:text-white prose-strong:font-semibold
    prose-em:italic

    prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-[18px] prose-blockquote:text-[#E4E4E5] prose-blockquote:leading-relaxed
    prose-blockquote:bg-[#0B0E14] prose-blockquote:border-l-4 prose-blockquote:border-tp-accent
    prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-8
    [&_blockquote_p]:my-2 [&_blockquote_p]:text-[#E4E4E5]

    prose-ul:list-disc prose-ul:pl-6 prose-ul:my-5 prose-ul:text-[#B8B8C0]
    prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-5 prose-ol:text-[#B8B8C0]
    prose-li:my-2 prose-li:pl-1 prose-li:leading-[1.75]
    prose-li:marker:text-tp-accent prose-li:marker:font-bold

    prose-code:bg-[#0B0E14] prose-code:text-tp-accent prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[14px] prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-[#0B0E14] prose-pre:border prose-pre:border-[#161B22] prose-pre:rounded-xl prose-pre:p-5 prose-pre:my-8 prose-pre:text-[14px] prose-pre:leading-relaxed
    [&_pre_code]:bg-transparent [&_pre_code]:text-[#E4E4E5] [&_pre_code]:p-0

    prose-img:rounded-2xl prose-img:border prose-img:border-[#161B22] prose-img:my-8 prose-img:mx-auto prose-img:block prose-img:max-w-full prose-img:h-auto prose-img:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
    [&_figure]:my-8 [&_figure]:text-center
    [&_figcaption]:text-[13px] [&_figcaption]:text-[#71717A] [&_figcaption]:mt-3 [&_figcaption]:italic

    prose-table:my-0 prose-table:w-full prose-table:text-[14px] prose-table:border-collapse
    prose-thead:border-b prose-thead:border-[#161B22]
    prose-th:bg-[#0B0E14] prose-th:text-white prose-th:font-bold prose-th:uppercase prose-th:tracking-wider prose-th:text-[11px] prose-th:px-4 prose-th:py-3 prose-th:text-left
    prose-td:px-4 prose-td:py-3 prose-td:text-[#B8B8C0] prose-td:border-b prose-td:border-[#161B22]/60
    prose-tr:border-0 [&_tbody_tr:last-child_td]:border-b-0
    [&_.overflow-x-auto]:border [&_.overflow-x-auto]:border-[#161B22] [&_.overflow-x-auto]:rounded-xl [&_.overflow-x-auto]:my-8

    prose-hr:border-[#161B22] prose-hr:my-10

    [&_u]:underline [&_u]:underline-offset-4 [&_u]:decoration-white/40
    [&_s]:opacity-60

    [&_iframe]:max-w-full [&_iframe]:border-0 [&_iframe]:rounded-xl
    [&_.embed-container]:my-8
    [&_p:has(iframe)]:my-0 [&_p:has(iframe)]:leading-none
    [&_.twitter-tweet]:mx-auto [&_.twitter-tweet]:my-8
    [&_.instagram-media]:mx-auto [&_.instagram-media]:my-8
    [&_.fb-post]:mx-auto [&_.fb-post]:my-8`;
