"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarClock } from "lucide-react";
import ReleaseCard, { type ReleaseCardGame } from "@/components/games/ReleaseCard";
import { rawName } from "@/components/home/DiscoverGames";

/** The row's own payload: the card's shape, plus how the pick was made. */
interface UpcomingGame extends Omit<ReleaseCardGame, "platforms"> {
    platforms?: (string | { platform?: { name?: string } } | null)[];
    reason?: "wishlist" | "taste" | null;
}

const fetcher = () =>
    axios.get("/me/upcoming").then((r) => (r.data?.data ?? []) as UpcomingGame[]);

/**
 * More columns as the screen widens, which is the same thing as smaller
 * posters: five across a 1900px panel gave each card 340px and a 450px-tall
 * cover, so a strip of what's coming took up half a screen.
 */
const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 2xl:grid-cols-8 gap-3.5";

/**
 * Card count has to follow column count or the last row comes out short. The
 * endpoint sends eight; these keep the visible run a whole number of rows at
 * every width — four at the narrowest, six in the middle, all eight when there
 * is a column for each.
 */
// sm:flex rather than sm:block — the card's own root is a flex column, and
// unhiding it with `block` would drop the layout that puts its footer on the
// floor of the card.
const VISIBILITY = (i: number) => (i < 4 ? "" : i < 6 ? "hidden sm:flex" : "hidden 2xl:flex");

/**
 * What is coming that this reader would care about.
 *
 * The cards are the calendar's, not a second interpretation of them — the two
 * pages were showing the same games in two different shapes. Everything about
 * how a release is drawn now lives in ReleaseCard, so the poster, the date,
 * the platform marks, the hype figure and the two controls stay identical
 * wherever a release appears.
 */
export default function UpcomingForYouRow() {
    const { data: games, isLoading, mutate } = useSWR("me-upcoming", fetcher, {
        dedupingInterval: 300_000,
        revalidateOnFocus: false,
    });

    return (
        <Panel title="Upcoming For You" action={{ label: "Full calendar", href: "/calendar" }}>
            {isLoading && !games ? (
                <div className={GRID}>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`aspect-[3/4] rounded-[12px] bg-white/[0.04] animate-pulse ${VISIBILITY(i)}`} />
                    ))}
                </div>
            ) : !games?.length ? (
                <EmptyState
                    icon={<CalendarClock className="w-[18px] h-[18px]" />}
                    title="Nothing on the horizon yet"
                    body="Wishlist a few unreleased games, or add to your collection — this fills with what is coming that matches what you play."
                    action={{ label: "Open the calendar", href: "/calendar" }}
                />
            ) : (
                <div className={GRID}>
                    {games.slice(0, 8).map((game, i) => (
                        <ReleaseCard
                            key={game.slug}
                            className={VISIBILITY(i)}
                            href={`/calendar/${game.slug}`}
                            onChanged={() => mutate()}
                            game={{
                                ...game,
                                // The dashboard payload carries platforms in the
                                // store's own shapes; the card wants names.
                                platforms: (game.platforms ?? []).map(rawName).filter(Boolean),
                            }}
                        />
                    ))}
                </div>
            )}
        </Panel>
    );
}
