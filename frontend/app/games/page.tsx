import { Metadata } from "next";
import { Suspense } from "react";
import { generatePageMetadata } from "@/lib/seo";
import GameDatabaseHub from "@/components/games/GameDatabaseHub";

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

export default function GamesPage() {
    return (
        <Suspense>
            <GameDatabaseHub />
        </Suspense>
    );
}
