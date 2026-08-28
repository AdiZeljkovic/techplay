import { Metadata } from "next";
import { Suspense } from "react";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import GameDatabaseHub from "@/components/games/GameDatabaseHub";
import GamesIndexShell, { type ShelfGame } from "@/components/games/GamesIndexShell";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/games', {
        title: "All Games",
        description: "Discover the latest games, reviews, and release dates on TechPlay.",
    });
}

/**
 * Rendered once, not per request.
 *
 * This carried `dynamic = 'force-dynamic'` because "filters live in URL search
 * params" — but GameDatabaseHub is a client component: it reads the params in
 * the browser and fetches through SWR, so the server render is identical for
 * every visitor and every filter. Forcing dynamic bought nothing and cost the
 * page its cache — production answered `private, no-cache, no-store` here
 * while every other page served an ISR hit, so the database, one of the
 * largest SEO surfaces on the site, re-rendered on the origin for every visit.
 *
 * The Suspense boundary below is what makes this legal: useSearchParams inside
 * it does not drag the route into dynamic rendering.
 */
export const revalidate = 3600;

/**
 * The first shelf of games, fetched on the server so the fallback has something
 * to say.
 *
 * Ordered the way the hub itself opens — highest rated first — so what a
 * crawler reads and what a reader sees a moment later are the same games in
 * the same order.
 */
async function openingShelf(): Promise<ShelfGame[]> {
    try {
        const res = await fetch(
            `${getServerApiUrl()}/games?ordering=-rating&page_size=24`,
            { next: { revalidate: 3600 }, headers: serverHeaders() },
        );

        if (!res.ok) return [];

        const json = await res.json();

        return (json.results ?? []).map((g: ShelfGame) => ({
            slug: g.slug,
            name: g.name,
            cover_url: g.cover_url ?? null,
        }));
    } catch {
        // An empty shelf is a page without links, which is where this started.
        // It is still better than a page that fails to build.
        return [];
    }
}

export default async function GamesPage() {
    const games = await openingShelf();

    return (
        /*
         * The fallback is not a spinner — it is the page.
         *
         * useSearchParams inside a statically rendered route makes Next skip
         * server-rendering this subtree and write the fallback into the HTML.
         * That fallback was `undefined`, so /games shipped with no H1, no
         * intro and no links: 0 anchors into a catalogue of 332,455 games,
         * measured on production.
         *
         * Now the HTML carries the heading, the sentence and the first two
         * dozen games as real hrefs, and the client swaps in the interactive
         * hub on hydration.
         */
        <Suspense
            fallback={
                <GamesIndexShell
                    intro="Discover, explore and track games across every generation."
                    games={games}
                />
            }
        >
            <GameDatabaseHub />
        </Suspense>
    );
}
