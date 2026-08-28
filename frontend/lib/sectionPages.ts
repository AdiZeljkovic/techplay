import { getServerApiUrl, serverHeaders } from "@/lib/api";

/**
 * A page of a section's listing, fetched on the server.
 *
 * 630 articles are published and all 630 sit in sitemap-articles.xml, but only
 * 43 could be reached by following a link: each listing renders thirteen and
 * the pager was a pair of buttons, so everything past the first screen existed
 * only as client state. A sitemap tells a search engine a page exists; a link
 * is what tells it the page matters, and 587 pieces had none.
 *
 * /news/page/2 gives every one of them an address that can be walked to.
 * /news itself stays static and is page one; there is no /news/page/1, so each
 * page has exactly one URL.
 */
export interface SectionPageData {
    body: unknown;
    lastPage: number;
}

/** The API endpoint behind each section's listing. */
export const SECTION_ENDPOINT: Record<string, string> = {
    news: "news",
    reviews: "reviews",
    guides: "guides",
    tech: "tech",
};

export async function fetchSectionPage(section: string, page: number): Promise<SectionPageData | null> {
    const endpoint = SECTION_ENDPOINT[section];

    if (!endpoint) return null;

    try {
        const res = await fetch(`${getServerApiUrl()}/${endpoint}?page=${page}`, {
            next: { revalidate: 300, tags: [section] },
            headers: serverHeaders(),
        });

        if (!res.ok) return null;

        const body = await res.json();

        // Laravel's paginator puts it under meta; a few of these endpoints
        // answer with it at the top level instead.
        const lastPage =
            body?.meta?.last_page ?? body?.last_page ?? 1;

        return { body, lastPage: Number(lastPage) || 1 };
    } catch {
        return null;
    }
}
