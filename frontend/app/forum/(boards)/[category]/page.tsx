import type { Metadata } from "next";
import { getApiUrl, serverHeaders } from "@/lib/api";
import CategoryClient, { type CategoryData } from "./CategoryClient";
import { notFound } from "next/navigation";

/**
 * A board, rendered on the server before the browser gets involved.
 *
 * Measured against production before this existed: the HTML for a board page
 * was 66 KB and contained the title of not one thread. Everything arrived after
 * the JavaScript ran, so a crawler saw an empty shell — and since every page
 * under /forum inherited one generic title, the whole forum looked to a search
 * engine like a single page called "Community Forums".
 *
 * So the board is fetched here and handed to the client half as its starting
 * data. The rows are in the HTML, the page has its own title and description,
 * and the interactive parts — paging, tag filters, live threads, unread marks —
 * carry on exactly as they were.
 */

/* Threads move constantly and there are few enough boards to render each time.
   ISR is deliberately not used: this site disabled it for large listings after
   filling its disk, and Cloudflare caches the response at the edge anyway. */
export const dynamic = "force-dynamic";

async function loadBoard(slug: string): Promise<CategoryData | null> {
    try {
        const res = await fetch(`${getApiUrl()}/forum/categories/${slug}`, {
            // serverHeaders, not a bare Accept: the API meters `api` at sixty
            // requests a minute keyed on the caller's IP, and every server
            // render leaves this process from one address — so without the
            // shared secret the whole forum renders out of one visitor's
            // budget, and a crawler walking it exhausts that in seconds.
            headers: serverHeaders(),
            cache: "no-store",
        });

        // A private board answers 404 to this unauthenticated request, which is
        // the right answer — it should not be in anybody's HTML. The client
        // then fetches it with the reader's own token.
        if (!res.ok) return null;

        return (await res.json()) as CategoryData;
    } catch {
        // The board still renders; it just starts empty and fills in.
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>;
}): Promise<Metadata> {
    const { category } = await params;
    const data = await loadBoard(category);

    if (!data?.category) {
        return { title: "Board" };
    }

    const name = data.category.name;
    const threads = data.category.threads_count ?? 0;
    const description =
        data.category.description?.trim()
        || `${threads} ${threads === 1 ? "thread" : "threads"} in ${name} on the TechPlay community forum.`;

    return {
        title: name,
        description,
        // Each board is its own page now. Everything under /forum used to
        // declare /forum as its canonical, which tells Google to drop these
        // URLs from the index entirely.
        alternates: { canonical: `/forum/${category}` },
        openGraph: {
            title: `${name} — TechPlay Forum`,
            description,
            type: "website",
        },
    };
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ category: string }>;
}) {
    const { category } = await params;
    const initial = await loadBoard(category);

    /*
     * A board that does not exist is not a board with nothing in it.
     *
     * /forum/general and /forum/gaming-discussion are not categories on this
     * site, and both answered 200 with no canonical — the same soft-404 the
     * article routes have. Google reads 200 as "this page is fine", so a
     * mistyped link from anywhere outside becomes a page in the index.
     */
    if (!initial?.category) notFound();

    return <CategoryClient initial={initial} />;
}
