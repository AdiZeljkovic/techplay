import { getServerApiUrl, serverHeaders } from "@/lib/api";

/**
 * The RSS feed, served from the site's own domain.
 *
 * The XML is built by the backend (RssController) — it already writes every
 * link against FRONTEND_URL, so the document is correct for techplay.gg. What
 * was missing was a door on this side: the footer pointed at /rss and the
 * <link rel="alternate"> at /feed, and neither route existed here, so both
 * answered 404 while the feed itself sat on the API host where no reader
 * would look for it.
 *
 * Proxying rather than regenerating keeps one source of truth, and keeps the
 * public feed URL independent of whatever the API is called.
 */
export const revalidate = 900; // fifteen minutes is fresh enough for a feed

export async function GET(_request?: Request) {
    const root = getServerApiUrl().replace(/\/api\/v1\/?$/, "");

    try {
        const res = await fetch(`${root}/feed`, {
            headers: serverHeaders({ Accept: "application/rss+xml, application/xml, text/xml" }),
            next: { revalidate: 900 },
        });

        if (!res.ok) {
            return new Response("Feed unavailable", {
                status: 502,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }

        const xml = await res.text();

        return new Response(xml, {
            status: 200,
            headers: {
                "Content-Type": "application/rss+xml; charset=utf-8",
                "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=3600",
            },
        });
    } catch {
        return new Response("Feed unavailable", {
            status: 502,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }
}
