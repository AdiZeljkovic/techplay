"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";

type Tab = "trending" | "new" | "coming";

const TABS: { id: Tab; label: string }[] = [
    { id: "trending", label: "Trending" },
    { id: "new", label: "New Releases" },
    { id: "coming", label: "Coming Soon" },
];

interface DiscoverGame {
    id: number | string;
    slug: string;
    name: string;
    background_image: string | null;
    rating?: number;
    metacritic?: number | null;
    genre_names?: string[];
    platform_names?: string[];
    genres?: { name: string }[];
    platforms?: { platform: { name: string } }[];
}

const isoDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
};

async function fetchTab(tab: Tab): Promise<DiscoverGame[]> {
    if (tab === "trending") {
        const r = await axios.get("/games", { params: { ordering: "-views", page_size: 10 } });
        return (r.data?.results ?? []).slice(0, 5);
    }
    if (tab === "new") {
        const r = await axios.get("/games/calendar", { params: { start_date: isoDaysAgo(30), end_date: isoDaysAgo(0) } });
        return (r.data?.results ?? []).slice().reverse().slice(0, 5);
    }
    const r = await axios.get("/games/calendar"); // upcoming 90 days
    return (r.data?.results ?? []).slice(0, 5);
}

/** Normalizes /games (TEXT[] columns) and /games/calendar (RAWG objects) shapes. */
function meta(g: DiscoverGame) {
    const genres = g.genre_names?.length ? g.genre_names : (g.genres ?? []).map((x) => x.name);
    const platforms = g.platform_names?.length ? g.platform_names : (g.platforms ?? []).map((x) => x.platform.name);
    const score = g.metacritic ? (g.metacritic / 10).toFixed(1) : g.rating && g.rating > 0 ? (g.rating <= 5 ? g.rating * 2 : g.rating).toFixed(1) : null;
    return { genres: genres.filter(Boolean).slice(0, 2), platforms: platforms.filter(Boolean).slice(0, 2), score };
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
                    <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-white font-display">
                        <span className="w-1.5 h-5 rounded-sm bg-[var(--accent)]" />
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
                                        ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                                        : "text-white/40 border border-transparent hover:text-white"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Link href="/games" className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                    View all games <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(games ?? Array.from({ length: 5 }, () => null)).map((g, i) =>
                    g ? (
                        <Link
                            key={`${g.slug}-${i}`}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-[var(--bg-card)] hover:border-[var(--accent)]/40 transition-all"
                        >
                            <div className="relative aspect-[3/4]">
                                {g.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/10"><Gamepad2 className="w-10 h-10" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                                {meta(g).score && (
                                    <span className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[var(--accent)] text-white text-[12px] font-black tabular-nums">
                                        {meta(g).score}
                                    </span>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                        {g.name}
                                    </h3>
                                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                                        {meta(g).platforms.map(shortPlatform).join(" · ")}
                                    </p>
                                    <p className="text-[10px] text-white/35">{meta(g).genres.join(", ")}</p>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div key={i} className="rounded-xl bg-white/5 aspect-[3/4] animate-pulse" />
                    )
                )}
            </div>
        </section>
    );
}
