"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import ScoreBadge from "@/components/ui/ScoreBadge";

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
    if (s.includes("xbox series")) return "XSX";
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
                {(games ?? Array.from({ length: 5 }, () => null)).map((g, i) =>
                    g ? (
                        <Link
                            key={`${g.slug}-${i}`}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            className="group relative rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300"
                        >
                            <div className="relative aspect-[3/4]">
                                {g.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--ink-faint)]"><Gamepad2 className="w-10 h-10" /></div>
                                )}
                                <div className="absolute inset-0 scrim-card" />

                                {/* chart rank — outlined ghost numeral, ignites accent on hover */}
                                <span
                                    aria-hidden
                                    className="absolute top-1 left-2.5 font-display text-[56px] font-black leading-none select-none text-transparent transition-all duration-300 [-webkit-text-stroke:1.5px_rgba(255,255,255,0.28)] group-hover:[-webkit-text-stroke:1.5px_var(--accent)] group-hover:drop-shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                >
                                    {i + 1}
                                </span>

                                {meta(g).score && (
                                    <span className="absolute top-2 right-2">
                                        <ScoreBadge score={parseFloat(meta(g).score!)} variant="pill" />
                                    </span>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="font-display text-[14px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                        {g.name}
                                    </h3>
                                    {(() => {
                                        const m = meta(g);
                                        const secondary = tab === "trending" ? m.genres.join(", ") : releaseLabel(g.released);
                                        return (
                                            <>
                                                {m.platforms.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {m.platforms.map((p) => (
                                                            <span key={p} className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/15 text-[9px] font-bold uppercase tracking-wider text-white/85">
                                                                {p}
                                                            </span>
                                                        ))}
                                                        {secondary && (
                                                            <span className="px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] backdrop-blur-sm border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[9px] font-bold uppercase tracking-wider text-white/90">
                                                                {secondary}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* reveal CTA — slides up on hover */}
                                                <span className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] max-h-0 opacity-0 group-hover:max-h-6 group-hover:opacity-100 group-hover:mt-2 overflow-hidden transition-all duration-300">
                                                    View game <ChevronRight className="w-3 h-3" />
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div key={i} className="rounded-[var(--radius-card)] bg-[var(--fill-2)] aspect-[3/4] animate-pulse" />
                    )
                )}
            </div>
        </section>
    );
}
