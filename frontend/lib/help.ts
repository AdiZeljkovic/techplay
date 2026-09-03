import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";

/**
 * Where the help centre lives, and how it is read.
 *
 * ── The two hostnames, and why every link here is a bare path ───────────
 *
 * The help centre is a second hostname over the same Next application. Its
 * pages sit at /help/* in this repo and are served from help.techplay.gg/*,
 * mapped by a host rewrite in next.config.ts. So the path in the browser's
 * address bar is never the path in this repo:
 *
 *     repo            /help/connections/steam-library-is-not-syncing
 *     browser         help.techplay.gg/connections/steam-library-is-not-syncing
 *
 * Every href rendered inside the help centre is therefore the **browser's**
 * path — `/connections/steam-…`, not `/help/connections/steam-…`. The API
 * already returns exactly that shape in `url`. Writing `/help/…` into a link
 * would still work, because techplay.gg/help/* is a 301 to here, but it would
 * cost a redirect on every click and hand crawlers a URL we then tell them not
 * to use.
 *
 * ── And why they are plain anchors ──────────────────────────────────────
 *
 * The pages use `<a>` rather than next/link. A help centre is read one page at
 * a time by somebody who arrived from Google with a problem; there is nothing
 * to keep warm between navigations, and prefetching every answer in a topic
 * list to save 80ms is work done on behalf of nobody. It also keeps these
 * pages at zero JavaScript, which is the point — the reader who cannot get
 * past the sign-up form is quite often the reader whose browser is the problem.
 */

/** The subdomain, from the same env var next.config.ts reads for its rewrite. */
export const HELP_HOST = process.env.NEXT_PUBLIC_HELP_HOST || "help.techplay.gg";

export const HELP_URL = `https://${HELP_HOST}`;

/** The main site, for the links that deliberately leave. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg").replace(/\/$/, "");

export interface HelpCard {
    title: string;
    slug: string;
    excerpt?: string | null;
    topic_slug?: string | null;
    topic_name?: string | null;
    url: string;
}

export interface HelpTopic {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    articles: HelpCard[];
}

export interface HelpAnswer {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    seo_title?: string | null;
    seo_description?: string | null;
    is_noindex: boolean;
    updated_at: string | null;
    published_at: string | null;
    url: string;
}

export interface HelpIndex {
    topics: HelpTopic[];
    popular: HelpCard[];
}

export interface HelpAnswerPage {
    article: HelpAnswer;
    topic: { name: string | null; slug: string | null; description: string | null };
    related: HelpCard[];
}

interface Envelope<T> {
    success: boolean;
    data: T;
}

/**
 * An hour, and a tag.
 *
 * The hour is the floor, not the ceiling: `HelpArticleObserver` purges the tag
 * the moment an editor saves, so a correction is live in seconds. The number
 * only decides how long a page that nobody has edited waits before checking —
 * and a help answer that nobody has edited has not changed.
 */
const CACHE = 3600;

/** The whole centre: topics, their answers, and the most-read ones. */
export async function getHelpIndex(): Promise<HelpIndex | null> {
    const body = await fetchContent<Envelope<HelpIndex>>(`${getServerApiUrl()}/help`, {
        headers: serverHeaders(),
        next: { revalidate: CACHE, tags: ["help"] },
    });

    return body?.data ?? null;
}

export async function getHelpTopic(slug: string): Promise<HelpTopic | null> {
    const body = await fetchContent<Envelope<HelpTopic>>(
        `${getServerApiUrl()}/help/topics/${encodeURIComponent(slug)}`,
        {
            headers: serverHeaders(),
            next: { revalidate: CACHE, tags: ["help", `help-category-${slug}`] },
        },
    );

    return body?.data ?? null;
}

export async function getHelpAnswer(slug: string): Promise<HelpAnswerPage | null> {
    const body = await fetchContent<Envelope<HelpAnswerPage>>(
        `${getServerApiUrl()}/help/answers/${encodeURIComponent(slug)}`,
        {
            headers: serverHeaders(),
            next: { revalidate: CACHE, tags: ["help", `help-article-${slug}`] },
        },
    );

    return body?.data ?? null;
}

/**
 * Search results.
 *
 * Not cached by Next: the backend already holds each query for five minutes,
 * and caching a per-query URL here would fill the fetch cache with one entry
 * per phrase anybody has ever typed — including the ones a crawler invents,
 * which is why robots.txt keeps them out of /search in the first place.
 */
export async function searchHelp(query: string): Promise<HelpCard[]> {
    const q = query.trim();

    if (q.length < 2) return [];

    const body = await fetchContent<Envelope<{ results: HelpCard[] }>>(
        `${getServerApiUrl()}/help/search?q=${encodeURIComponent(q)}`,
        { headers: serverHeaders(), cache: "no-store" },
    );

    return body?.data?.results ?? [];
}

/**
 * "Last reviewed", in the site's own timezone.
 *
 * What a reader wants to know about a help page is whether it is still true,
 * so the date on the page is the one it was last touched. Fixed to Sarajevo
 * rather than the server's idea of local time, for the same reason the article
 * dates are: a date that shifts depending on which machine rendered it is a
 * date that disagrees with the one in the structured data.
 */
export function reviewedOn(value: string | null | undefined): string | null {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Sarajevo",
    }).format(date);
}
