"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { Bell, Check, Gamepad2, Loader2 } from "lucide-react";
import axios from "@/lib/axios";
import { getApiUrl } from "@/lib/api";
import Panel from "@/components/ui/Panel";
import { useLibraryIndex } from "@/hooks/useLibraryIndex";

import { rawName } from "@/components/home/DiscoverGames";

interface CalendarGame {
    slug: string;
    name: string;
    released: string | null;
    cover_url: string | null;
    platforms?: (string | { platform?: { name?: string } } | null)[];
}

const fetcher = () =>
    axios.get("/games/calendar").then((r) => (r.data?.results ?? []) as CalendarGame[]);

function releaseLabel(released: string): string {
    const date = new Date(released);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Days until launch, split so the number can carry the tile. */
function countdown(released: string): { value: string; unit: string; imminent: boolean } | null {
    const date = new Date(released);
    if (Number.isNaN(date.getTime())) return null;

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);

    if (days < 0) return { value: "OUT", unit: "now", imminent: false };
    if (days === 0) return { value: "0", unit: "today", imminent: true };
    if (days === 1) return { value: "1", unit: "day", imminent: true };
    if (days < 7) return { value: String(days), unit: "days", imminent: true };
    if (days < 30) return { value: String(Math.round(days / 7)), unit: "weeks", imminent: false };
    return { value: String(Math.round(days / 30)), unit: "months", imminent: false };
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

    const upcoming = (games ?? []).filter((g) => g.released).slice(0, 4);
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
        <Panel
            title="Upcoming For You"
            action={{ label: "View all", href: "/calendar" }}
            bodyClassName="p-4"
        >
            {/* A grid, not a clipped rail — a card sliced in half by the panel
                edge reads as broken rather than as "there is more". */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {(games ? upcoming : Array.from({ length: 4 }, () => null)).map((g, i) =>
                    g ? (
                        <div key={g.slug} className={`group/card flex flex-col rounded-[12px] overflow-hidden border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)] transition-all duration-300 tp-fade-up tp-d${Math.min(6, i + 1)}`}>
                            <Link href={`/games/${g.slug}`} prefetch={false} className="group block relative aspect-[16/9]">
                                {g.cover_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.cover_url} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--ink-faint)] bg-[var(--fill-1)]"><Gamepad2 className="w-8 h-8" /></div>
                                )}
                                <div className="absolute inset-0 scrim-card" />
                                {/* launch countdown — the reason to care, as a tile */}
                                {(() => {
                                    const c = g.released ? countdown(g.released) : null;
                                    if (!c) return null;
                                    return (
                                        <span
                                            className={`absolute top-2 left-2 flex flex-col items-center justify-center w-[46px] py-1.5 rounded-[var(--radius-inner)] backdrop-blur-md leading-none ${
                                                c.imminent
                                                    ? "bg-[var(--accent)] text-white shadow-[var(--glow-accent)]"
                                                    : "bg-[color-mix(in_srgb,var(--surface-0)_82%,transparent)] border border-[var(--line-strong)] text-[var(--ink-hi)]"
                                            }`}
                                        >
                                            <span className="font-display text-[16px] font-black tabular-nums">{c.value}</span>
                                            <span className="mt-0.5 font-display text-[8px] font-bold uppercase tracking-[0.14em] opacity-80">{c.unit}</span>
                                        </span>
                                    );
                                })()}
                            </Link>
                            {/* accent seam draws across on hover */}
                            <span aria-hidden className="block h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover/card:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]" />
                            {/* Fixed rhythm: two title lines are always reserved, so
                                every card's date, platforms and button line up. */}
                            <div className="flex-1 flex flex-col p-3">
                                <Link href={`/games/${g.slug}`} prefetch={false} className="block font-display text-[13px] font-bold text-white leading-snug line-clamp-2 min-h-[34px] hover:text-[var(--accent)] transition-colors">
                                    {g.name}
                                </Link>
                                <p className="mt-1 text-[11px] tabular-nums text-white/45">{releaseLabel(g.released!)}</p>
                                <p className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 line-clamp-1 min-h-[13px]">{shortPlatforms(g.platforms)}</p>
                                <span className="flex-1" />
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
                        <div key={i} className="rounded-[12px] bg-[var(--fill-2)] h-[236px] animate-pulse" />
                    )
                )}
            </div>
        </Panel>
    );
}
