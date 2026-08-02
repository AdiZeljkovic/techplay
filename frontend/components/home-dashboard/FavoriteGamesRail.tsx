"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, Plus, Clock3, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { DashboardGameCover } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import AddFavoriteInline from "./AddFavoriteInline";

/** 1240 → "1.2K h" — a shelf label, not a ledger entry. */
function hoursLabel(h: number): string {
    if (h >= 1000) return `${(h / 1000).toFixed(1).replace(/\.0$/, "")}K h`;
    return `${h}h`;
}

/**
 * A single shelf card: portrait art, then a footer strip carrying the two
 * facts that matter about a game you love — how long you've been in it and
 * how far through it you are.
 *
 * Both are conditional on purpose. Playtime only exists when Steam or
 * Discord measured it, and completion only when you set it. An untracked
 * game says so instead of claiming a confident 0.
 */
function ShelfCard({ game, index }: { game: DashboardGameCover; index: number }) {
    const tracked = !!game.playtime_source && (game.hours_played ?? 0) > 0;
    const progress = game.progress ?? 0;
    const done = progress >= 100 || game.status === "completed";

    return (
        <Link
            href={`/games/${game.slug}`}
            prefetch={false}
            title={game.name}
            className={`group snap-start shrink-0 w-[150px] sm:w-[168px] rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.55)] transition-all duration-300 tp-fade-up tp-d${Math.min(6, index + 1)}`}
        >
            <span className="relative block aspect-[3/4] overflow-hidden bg-[var(--fill-1)]">
                {game.background_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={game.background_image}
                        alt={game.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-[var(--ease-hud)]"
                    />
                )}
                {/* the title only surfaces on hover — the art should carry it */}
                <span aria-hidden className="absolute inset-0 scrim-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-x-0 bottom-0 p-2.5 text-[11px] font-bold text-white leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {game.name}
                </span>
            </span>

            <span className="flex items-center justify-between gap-2 h-[38px] px-2.5 border-t border-white/[0.07] bg-[color-mix(in_srgb,var(--surface-0)_60%,transparent)]">
                <span className="inline-flex items-center gap-1.5 min-w-0 font-display text-[11px] font-black tabular-nums text-white/60">
                    <Clock3 className="w-3.5 h-3.5 shrink-0 text-[var(--ink-faint)]" />
                    {tracked ? (
                        hoursLabel(game.hours_played ?? 0)
                    ) : (
                        <span className="text-[var(--ink-faint)] truncate" title="Connect Steam or Discord to track playtime">
                            Not tracked
                        </span>
                    )}
                </span>

                {done ? (
                    <span className="inline-flex items-center gap-1 h-[20px] px-1.5 rounded-[var(--radius-inner)] bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> 100%
                    </span>
                ) : progress > 0 ? (
                    <span className="inline-flex items-center h-[20px] px-1.5 rounded-[var(--radius-inner)] bg-[var(--accent)] text-[10px] font-bold tabular-nums text-white">
                        {progress}%
                    </span>
                ) : null}
            </span>
        </Link>
    );
}

/**
 * The shelf that says who this gamer is. Empty state is the inline
 * search-and-star picker, so the shelf can be filled without leaving home.
 */
export default function FavoriteGamesRail({
    favorites,
    username,
    total,
}: {
    favorites: DashboardGameCover[];
    username: string;
    /** Full favorite count — the rail only carries the first dozen. */
    total?: number;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const scroller = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ left: false, right: false });

    const measure = useCallback(() => {
        const el = scroller.current;
        if (!el) return;
        setEdges({
            left: el.scrollLeft > 8,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
        });
    }, []);

    useEffect(() => {
        measure();
        const el = scroller.current;
        if (!el) return;
        el.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
        return () => {
            el.removeEventListener("scroll", measure);
            window.removeEventListener("resize", measure);
        };
    }, [measure, favorites.length, pickerOpen]);

    const nudge = (dir: -1 | 1) => {
        scroller.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
    };

    const count = total ?? favorites.length;

    return (
        <Panel
            title="Favorite Games"
            icon={<Star className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={
                favorites.length > 0
                    ? { label: `View all (${count})`, href: `/profile/${username}?tab=collection` }
                    : undefined
            }
            bodyClassName="p-4"
        >
            {favorites.length === 0 ? (
                <AddFavoriteInline username={username} />
            ) : pickerOpen ? (
                <AddFavoriteInline username={username} defaultOpen onDismiss={() => setPickerOpen(false)} />
            ) : (
                <div className="relative">
                    <div
                        ref={scroller}
                        className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-px-1 -mx-1 px-1 pb-1"
                    >
                        {favorites.map((g, i) => (
                            <ShelfCard key={g.slug} game={g} index={i} />
                        ))}

                        {/* the shelf always has room for one more */}
                        <button
                            onClick={() => setPickerOpen(true)}
                            title="Add a favorite"
                            className="group snap-start shrink-0 w-[150px] sm:w-[168px] rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] bg-[var(--fill-1)] flex flex-col items-center justify-center gap-2 text-[var(--ink-faint)] hover:text-[var(--accent)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                        >
                            <Plus className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Add favorite</span>
                        </button>
                    </div>

                    {/* edge fades double as the "there's more" signal */}
                    {edges.left && (
                        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[var(--surface-1)] to-transparent" />
                    )}
                    {edges.right && (
                        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[var(--surface-1)] to-transparent" />
                    )}

                    {edges.left && (
                        <button
                            onClick={() => nudge(-1)}
                            aria-label="Scroll left"
                            className="absolute left-1 top-[40%] -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--surface-0)]/90 border border-[var(--line-strong)] backdrop-blur flex items-center justify-center text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors duration-300"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    {edges.right && (
                        <button
                            onClick={() => nudge(1)}
                            aria-label="Scroll right"
                            className="absolute right-1 top-[40%] -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--surface-0)]/90 border border-[var(--line-strong)] backdrop-blur flex items-center justify-center text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors duration-300"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </Panel>
    );
}
