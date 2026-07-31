"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { Bell, Check, ChevronRight, Gamepad2, Loader2, CalendarDays } from "lucide-react";
import axios from "@/lib/axios";
import { getApiUrl } from "@/lib/api";
import { useLibraryIndex } from "@/hooks/useLibraryIndex";

import { rawName } from "@/components/home/DiscoverGames";

interface CalendarGame {
    slug: string;
    name: string;
    released: string | null;
    background_image: string | null;
    platforms?: (string | { platform?: { name?: string } } | null)[];
}

const fetcher = () =>
    axios.get("/games/calendar").then((r) => (r.data?.results ?? []) as CalendarGame[]);

function releaseLabel(released: string): string {
    const date = new Date(released);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Days until launch, as a countdown a gamer actually reads. */
function countdown(released: string): { label: string; imminent: boolean } | null {
    const date = new Date(released);
    if (Number.isNaN(date.getTime())) return null;

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);

    if (days < 0) return { label: "Out now", imminent: false };
    if (days === 0) return { label: "Out today", imminent: true };
    if (days === 1) return { label: "Tomorrow", imminent: true };
    if (days < 7) return { label: `${days} days`, imminent: true };
    if (days < 30) return { label: `${Math.round(days / 7)} weeks`, imminent: false };
    return { label: `${Math.round(days / 30)} months`, imminent: false };
}

function shortPlatforms(platforms?: CalendarGame["platforms"]): string {
    return (platforms ?? [])
        .map(rawName)
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
                <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
                    Upcoming For You
                </h2>
                <Link href="/calendar" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 xl:mx-0 xl:px-0 scrollbar-none">
                {(games ? upcoming : Array.from({ length: 4 }, () => null)).map((g, i) =>
                    g ? (
                        <div key={g.slug} className={`group/card w-[240px] shrink-0 snap-start rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)] transition-all duration-300 tp-fade-up tp-d${Math.min(6, i + 1)}`}>
                            <Link href={`/games/${g.slug}`} prefetch={false} className="group block relative aspect-[16/9]">
                                {g.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--ink-faint)] bg-[var(--fill-1)]"><Gamepad2 className="w-8 h-8" /></div>
                                )}
                                <div className="absolute inset-0 scrim-card" />
                                {/* launch countdown — the reason to care */}
                                {(() => {
                                    const c = g.released ? countdown(g.released) : null;
                                    if (!c) return null;
                                    return (
                                        <span
                                            className={`absolute top-2 left-2 inline-flex items-center h-[22px] px-2.5 rounded-full backdrop-blur-md text-[9px] font-bold uppercase tracking-[0.1em] ${
                                                c.imminent
                                                    ? "bg-[var(--accent)] text-white shadow-[var(--glow-accent)]"
                                                    : "bg-[color-mix(in_srgb,var(--surface-0)_80%,transparent)] border border-[var(--line-strong)] text-[var(--ink-mid)]"
                                            }`}
                                        >
                                            {c.label}
                                        </span>
                                    );
                                })()}
                            </Link>
                            {/* accent seam draws across on hover */}
                            <span aria-hidden className="block h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover/card:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]" />
                            <div className="p-3">
                                <Link href={`/games/${g.slug}`} prefetch={false} className="block font-display text-[13px] font-bold text-[var(--ink-hi)] line-clamp-1 hover:text-[var(--accent)] transition-colors">
                                    {g.name}
                                </Link>
                                <p className="mt-0.5 text-[11px] tabular-nums text-[var(--ink-low)]">{releaseLabel(g.released!)}</p>
                                <p className="text-[9px] uppercase tracking-wide text-[var(--ink-faint)] line-clamp-1 min-h-[13px]">{shortPlatforms(g.platforms)}</p>
                                {(() => {
                                    const status = library[g.slug];
                                    const following = !!status;
                                    const isPending = pending === g.slug;
                                    return (
                                        <button
                                            onClick={() => toggle(g)}
                                            disabled={isPending}
                                            className={`mt-2.5 w-full flex items-center justify-center gap-1.5 h-9 rounded-[var(--radius-inner)] font-display text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                                                following
                                                    ? "bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[var(--accent)]"
                                                    : "bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] hover:bg-[var(--accent)] hover:border-transparent hover:text-white"
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
                        <div key={i} className="w-[240px] shrink-0 rounded-[var(--radius-card)] bg-[var(--fill-2)] h-[210px] animate-pulse" />
                    )
                )}
            </div>
        </section>
    );
}
