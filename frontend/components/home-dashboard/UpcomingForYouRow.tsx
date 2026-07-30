"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { Bell, Check, ChevronRight, Gamepad2, Loader2, CalendarDays } from "lucide-react";
import axios from "@/lib/axios";
import { getApiUrl } from "@/lib/api";
import { useLibraryIndex } from "@/hooks/useLibraryIndex";

interface CalendarGame {
    slug: string;
    name: string;
    released: string | null;
    background_image: string | null;
    platforms?: { platform: { name: string } }[];
}

const fetcher = () =>
    axios.get("/games/calendar").then((r) => (r.data?.results ?? []) as CalendarGame[]);

function releaseLabel(released: string): string {
    const date = new Date(released);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function shortPlatforms(platforms?: { platform: { name: string } }[]): string {
    return (platforms ?? [])
        .map((p) => p.platform.name)
        .filter((n) => /pc|windows|playstation|xbox|nintendo|switch/i.test(n))
        .slice(0, 3)
        .join(" · ");
}

/**
 * Upcoming releases rail with a wishlist toggle:
 * "Remind Me" adds the game to the wishlist (release notifications come from
 * the existing CheckWishlistReleases command); any non-dropped library status
 * shows as "Following". Clicking "Following" removes only wishlist entries —
 * games tracked with another status are left alone.
 */
export default function UpcomingForYouRow() {
    const { data: games } = useSWR("upcoming-for-you", fetcher, { dedupingInterval: 300_000, revalidateOnFocus: false });
    const { library } = useLibraryIndex();
    const { mutate } = useSWRConfig();
    const [pending, setPending] = useState<string | null>(null);

    const upcoming = (games ?? []).filter((g) => g.released).slice(0, 8);
    if (games && upcoming.length === 0) return null;

    const refreshLibrary = () => {
        // useLibraryIndex keys by [url, token] — match on the URL part.
        mutate((key) => Array.isArray(key) && key[0] === `${getApiUrl()}/collection/index`);
    };

    const toggle = async (g: CalendarGame) => {
        if (pending) return;
        const status = library[g.slug];
        setPending(g.slug);
        try {
            if (!status) {
                await axios.put(`/collection/games/${g.slug}`, { status: "wishlist" });
            } else if (status === "wishlist") {
                await axios.delete(`/collection/games/${g.slug}`);
            }
            refreshLibrary();
        } catch {
            // toggle is best-effort; the button simply stays in its previous state
        } finally {
            setPending(null);
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2.5 text-[15px] font-bold uppercase tracking-[0.08em] text-white font-display">
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
                    Upcoming For You
                </h2>
                <Link href="/calendar" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-[var(--accent)] transition-colors">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 xl:mx-0 xl:px-0 scrollbar-none">
                {(games ? upcoming : Array.from({ length: 4 }, () => null)).map((g, i) =>
                    g ? (
                        <div key={g.slug} className="w-[240px] shrink-0 snap-start rounded-xl overflow-hidden border border-white/[0.06] bg-[var(--bg-card)] hover:border-[var(--accent)]/30 transition-colors">
                            <Link href={`/games/${g.slug}`} prefetch={false} className="group block relative aspect-[16/9]">
                                {g.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/[0.02]"><Gamepad2 className="w-8 h-8" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            </Link>
                            <div className="p-3">
                                <Link href={`/games/${g.slug}`} prefetch={false} className="block text-[13px] font-bold text-white line-clamp-1 hover:text-[var(--accent)] transition-colors">
                                    {g.name}
                                </Link>
                                <p className="mt-0.5 text-[11px] text-white/45">{releaseLabel(g.released!)}</p>
                                <p className="text-[9px] uppercase tracking-wide text-white/30 line-clamp-1 min-h-[13px]">{shortPlatforms(g.platforms)}</p>
                                {(() => {
                                    const status = library[g.slug];
                                    const following = !!status;
                                    const isPending = pending === g.slug;
                                    return (
                                        <button
                                            onClick={() => toggle(g)}
                                            disabled={isPending}
                                            className={`mt-2.5 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                                following
                                                    ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
                                                    : "bg-white/5 border border-white/10 text-white hover:border-[var(--accent)]/40"
                                            }`}
                                            title={status && status !== "wishlist" ? `In your library (${status})` : undefined}
                                        >
                                            {isPending ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : following ? (
                                                <><Check className="w-3.5 h-3.5" /> Following</>
                                            ) : (
                                                <><Bell className="w-3.5 h-3.5" /> Remind Me</>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div key={i} className="w-[240px] shrink-0 rounded-xl bg-white/5 h-[210px] animate-pulse" />
                    )
                )}
            </div>
        </section>
    );
}
