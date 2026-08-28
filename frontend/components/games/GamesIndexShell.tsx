import Link from "next/link";
import { Gamepad2 } from "lucide-react";

/**
 * What a crawler — and a reader on a slow connection — sees before the hub
 * loads.
 *
 * /games is statically rendered and GameDatabaseHub is a client component that
 * calls useSearchParams(). Next answers that combination by giving up on
 * server-rendering the subtree and writing the Suspense fallback into the HTML
 * instead. The fallback was empty, so the largest SEO surface on the site
 * shipped 61 KB of chrome with no H1, no intro and not one link into the
 * catalogue — while /games/genre/action, which renders the same component
 * without a boundary because it is a dynamic route, came out fine.
 *
 * So the fallback carries the page instead of nothing: the heading, the
 * sentence under it, and the first two dozen games as real anchors. The client
 * replaces all of it a moment later with the interactive hub.
 *
 * The links are the point. A sitemap tells a search engine that a page exists;
 * a link tells it the page matters, and 332,455 game pages had none pointing
 * at them from anywhere on the site.
 */
export interface ShelfGame {
    slug: string;
    name: string;
    cover_url: string | null;
}

export default function GamesIndexShell({
    heading,
    intro,
    games,
}: {
    /** Omitted on /games itself, where the two-tone wordmark is the heading. */
    heading?: string;
    intro: string;
    games: ShelfGame[];
}) {
    return (
        <div className="container-page py-8">
            <h1 className="font-display font-black tracking-tight text-[28px] md:text-[58px] leading-none text-center">
                {heading ? (
                    <span className="text-white">{heading}</span>
                ) : (
                    <>
                        <span className="text-white">GAME </span>
                        <span className="text-[var(--accent)]">DATABASE</span>
                    </>
                )}
            </h1>

            <p className="mt-3 max-w-[720px] mx-auto text-center text-[13px] text-white/45">
                {intro}
            </p>

            {games.length > 0 && (
                <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {games.map((g) => (
                        <Link key={g.slug} href={`/games/${g.slug}`} className="group flex flex-col">
                            <span className="relative block aspect-[3/4] rounded-[10px] overflow-hidden border border-white/[0.07]">
                                {g.cover_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={g.cover_url}
                                        alt={g.name}
                                        width={300}
                                        height={400}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center bg-white/[0.03] text-white/15">
                                        <Gamepad2 className="w-6 h-6" />
                                    </span>
                                )}
                            </span>
                            <span className="mt-2 font-display text-[11.5px] font-bold text-white leading-tight line-clamp-2">
                                {g.name}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
