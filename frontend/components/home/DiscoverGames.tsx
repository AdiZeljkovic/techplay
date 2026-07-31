"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { getScoreMeta } from "@/lib/score";
import PlatformIcon from "@/components/games/PlatformIcon";

type Tab = "trending" | "new" | "coming";

const TABS: { id: Tab; label: string }[] = [
    { id: "trending", label: "Trending" },
    { id: "new", label: "New Releases" },
    { id: "coming", label: "Coming Soon" },
];

/** Entries vary by source: RAWG objects, Moby rows ({platform_name}), strings, or raw DB rows. */
type RawNamed = string | { name?: string; platform_name?: string; platform?: { name?: string } } | null | undefined;

interface DiscoverGame {
    id: number | string;
    slug: string;
    name: string;
    background_image: string | null;
    released?: string | null;
    added?: number;
    rating?: number;
    metacritic?: number | null;
    genre_names?: string[];
    platform_names?: string[];
    genres?: RawNamed[];
    platforms?: RawNamed[];
}

/** Tolerates every shape the three data sources produce. */
export function rawName(x: RawNamed): string {
    if (typeof x === "string") return x;
    return x?.platform?.name ?? x?.platform_name ?? x?.name ?? "";
}

const isoDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
};

/** RAWG's `added` (how many users track it) separates real launches from shovelware. */
const byPopularity = (a: DiscoverGame, b: DiscoverGame) => (b.added ?? 0) - (a.added ?? 0);

async function fetchReleasedSince(days: number): Promise<DiscoverGame[]> {
    const r = await axios.get("/games/calendar", {
        params: { start_date: isoDaysAgo(days), end_date: isoDaysAgo(0) },
    });
    return (r.data?.results ?? []) as DiscoverGame[];
}

async function fetchTab(tab: Tab): Promise<DiscoverGame[]> {
    if (tab === "trending") {
        // -views surfaces zero-view catalog filler (views are mostly null, ties
        // resolve by id) — top-rated modern hits ARE the trending rail for now
        const r = await axios.get("/games", { params: { ordering: "-rating", min_rating: 8.5, page_size: 10 } });
        return (r.data?.results ?? []).slice(0, 5);
    }
    if (tab === "new") {
        // Last 10 days of actual launches; a quiet fortnight would leave the rail
        // half-empty, so widen to 21 days when the short window is thin.
        let games = await fetchReleasedSince(10);
        if (games.length < 5) games = await fetchReleasedSince(21);
        return games.sort(byPopularity).slice(0, 5);
    }
    const r = await axios.get("/games/calendar"); // upcoming 90 days
    return ((r.data?.results ?? []) as DiscoverGame[]).sort(byPopularity).slice(0, 5);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function releaseLabel(released?: string | null): string | null {
    if (!released) return null;
    const d = new Date(released);
    if (Number.isNaN(d.getTime())) return null;
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return `${MONTHS[d.getMonth()]} ${d.getDate()}${sameYear ? "" : `, ${d.getFullYear()}`}`;
}

/** Normalizes /games (TEXT[] columns) and /games/calendar (RAWG objects) shapes. */
function meta(g: DiscoverGame) {
    const genres = g.genre_names?.length ? g.genre_names : (g.genres ?? []).map(rawName);
    const platforms = g.platform_names?.length ? g.platform_names : (g.platforms ?? []).map(rawName);
    const score = g.metacritic ? (g.metacritic / 10).toFixed(1) : g.rating && g.rating > 0 ? (g.rating <= 5 ? g.rating * 2 : g.rating).toFixed(1) : null;
    // dedupe after shortening — "Nintendo Switch" + "Nintendo Switch 2" both read SWITCH
    const shortPlatforms = [...new Set(platforms.filter(Boolean).map(shortPlatform))].slice(0, 2);
    return { genres: genres.filter(Boolean).slice(0, 2), platforms: shortPlatforms, score };
}

function shortPlatform(name: string): string {
    const s = name.toLowerCase();
    if (s.includes("playstation 5")) return "PS5";
    if (s.includes("playstation")) return "PS";
    if (s.includes("xbox series")) return "SERIES";
    if (s.includes("xbox")) return "XBOX";
    if (s.includes("nintendo") || s.includes("switch")) return "SWITCH";
    if (s.includes("pc") || s.includes("windows")) return "PC";
    return name;
}

export default function DiscoverGames() {
    const [tab, setTab] = useState<Tab>("trending");
    const { data: games } = useSWR(["discover-games", tab], () => fetchTab(tab), {
        dedupingInterval: 300_000,
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-5">
                    <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        Discover Games
                    </h2>
                    <div className="flex items-center gap-1">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors",
                                    tab === t.id
                                        ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
                                        : "text-[var(--ink-low)] border border-transparent hover:text-[var(--ink-hi)]"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Link href="/games" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150">
                    View all games <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                {(games ?? Array.from({ length: 5 }, () => null)).map((g, i) => {
                    if (!g) {
                        return <div key={i} className="rounded-[var(--radius-card)] bg-[var(--fill-2)] aspect-[3/5] animate-pulse" />;
                    }
                    const m = meta(g);
                    const secondary = tab === "trending" ? m.genres.join(" · ") : releaseLabel(g.released);
                    const scoreValue = m.score ? parseFloat(m.score) : null;
                    const verdict = scoreValue !== null ? getScoreMeta(scoreValue) : null;

                    return (
                        <Link
                            key={`${g.slug}-${i}`}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            className="group relative flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.55)] transition-all duration-300"
                        >
                            {/* Artwork — untouched, no overlays fighting the cover */}
                            <div className="relative aspect-[3/4] overflow-hidden">
                                {g.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--ink-faint)] bg-[var(--fill-1)]"><Gamepad2 className="w-10 h-10" /></div>
                                )}
                                {/* whisper of a scrim so the seam to the footer never bands */}
                                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
                            </div>

                            {/* accent seam — draws itself across the card on hover */}
                            <span aria-hidden className="h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]" />

                            {/* Info deck on clean surface */}
                            <div className="flex-1 flex items-start gap-3 p-3">
                                <span className="flex-1 min-w-0">
                                    <h3 className="font-display text-[13px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-300">
                                        {g.name}
                                    </h3>
                                    <span className="mt-2 flex items-center gap-2 min-h-[16px]">
                                        {m.platforms.map((p) => (
                                            <span key={p} title={p} className="text-[var(--accent)]">
                                                <PlatformIcon label={p} className="w-4 h-4" />
                                            </span>
                                        ))}
                                        {secondary && (
                                            <span className="text-[9px] uppercase tracking-wider text-[var(--ink-faint)] truncate">
                                                {secondary}
                                            </span>
                                        )}
                                    </span>
                                </span>

                                {/* verdict emblem — notched plate that glows in its own color */}
                                {scoreValue !== null && verdict && (
                                    <span className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                                        <span
                                            className="flex items-center justify-center w-[44px] h-[32px] font-display text-[15px] font-bold tabular-nums transition-shadow duration-300"
                                            style={{
                                                color: verdict.color,
                                                backgroundColor: `color-mix(in srgb, ${verdict.color} 12%, transparent)`,
                                                border: `1px solid color-mix(in srgb, ${verdict.color} 45%, transparent)`,
                                                boxShadow: `0 0 14px color-mix(in srgb, ${verdict.color} 25%, transparent)`,
                                                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
                                            }}
                                        >
                                            {scoreValue.toFixed(1)}
                                        </span>
                                        <span className="text-[7px] font-black uppercase tracking-[0.14em]" style={{ color: verdict.color, opacity: 0.85 }}>
                                            {verdict.label}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
