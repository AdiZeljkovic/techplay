"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { Search, X, Lock, Gamepad2, Loader2 } from "lucide-react";
import axios from "@/lib/axios";
import EmptyState from "@/components/ui/EmptyState";
import Segmented from "@/components/ui/Segmented";
import { usePagedList } from "@/hooks/usePagedList";
import Select from "@/components/ui/Select";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? r.data);

type SteamStatus = "unlocked" | "locked" | "all";

interface SteamAchievement {
    id: number;
    display_name: string | null;
    description: string | null;
    achieved: boolean;
    achieved_at: string | null;
    game: { id: number; name: string; slug: string; cover_url: string | null } | null;
}

interface Payload {
    total: number;
    achieved: number;
    locked: number;
    completion_pct: number;
    games: { id: number; name: string; total: number; achieved: number }[];
    items: SteamAchievement[];
    meta: { page: number; last_page: number; per_page: number; total: number };
}

const dayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Platform unlocks, under the same controls as our own.
 *
 * They used to live in a panel of their own beneath the whole tab, showing the
 * hundred most recent unlocks with no search, no paging and no way to reach
 * the four thousand still locked — because the endpoint had `achieved = true`
 * baked in and answered with a fixed hundred. Now they answer to the same
 * question the badges above them do: what have I got, what is left.
 *
 * The game's cover stands in for an icon. Steam reports achievement art only
 * through GetSchemaForGame, which is a second call per game and which we do
 * not make, so every `icon_url` here is null — the cover is both true and more
 * useful, since a Steam achievement means nothing without the game it is in.
 */
export default function SteamAchievementList({ username, isOwnProfile = false }: { username: string; isOwnProfile?: boolean }) {
    const [status, setStatus] = useState<SteamStatus>("unlocked");
    const [query, setQuery] = useState("");
    const [game, setGame] = useState("0");
    const [page, setPage] = useState(1);
    const [debounced, setDebounced] = useState("");

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 300);

        return () => clearTimeout(t);
    }, [query]);

    // Any change of question starts at the first page again; without this a
    // narrow search on page four answers with nothing and looks broken.
    useEffect(() => { setPage(1); }, [status, debounced, game]);

    /** The pager sits under the grid; a new page starts at its top. */
    const { ref: listTop, scrollToTop } = usePagedList<HTMLDivElement>();

    const goToPage = (next: number) => {
        setPage(next);
        scrollToTop();
    };

    const key = `/users/${username}/steam-achievements?status=${status}`
        + `&q=${encodeURIComponent(debounced)}&game=${game}&page=${page}&per_page=24`;

    const { data, isLoading } = useSWR<Payload>(key, fetcher, { keepPreviousData: true });

    if (!isLoading && (!data || data.total === 0)) {
        return (
            <EmptyState
                icon={<Gamepad2 className="w-[18px] h-[18px]" />}
                title="No Steam achievements yet"
                // Only the owner can act on this. A visitor was being told to
                // connect Steam to see somebody else's unlocks.
                body={isOwnProfile ? "Connect Steam in settings and they arrive with your library." : "This player has not connected Steam."}
            />
        );
    }

    const games = data?.games ?? [];

    return (
        <div ref={listTop} className="space-y-4">
            <Segmented
                ariaLabel="Filter Steam achievements"
                value={status}
                onChange={(id) => setStatus(id as SteamStatus)}
                className="w-full"
                items={[
                    { id: "all", label: "All", count: data?.total },
                    { id: "unlocked", label: "Unlocked", count: data?.achieved },
                    { id: "locked", label: "Locked", count: data?.locked },
                ]}
            />

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search Steam achievements…"
                        className="h-8 w-[220px] pl-8 pr-7 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <Select
                        value={game}
                        onChange={setGame}
                        ariaLabel="Filter by game"
                        options={[
                            { value: "0", label: `All games (${games.length})` },
                            ...games.map((g) => ({ value: String(g.id), label: `${g.name} — ${g.achieved}/${g.total}` })),
                        ]}
                        className="h-8 px-3 text-[12px] max-w-[240px]"
                        menuClassName="w-[280px]"
                    />
                </div>

                {data && (
                    <span className="ml-auto font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/25">
                        {data.achieved.toLocaleString()} of {data.total.toLocaleString()} · {data.completion_pct}%
                    </span>
                )}
            </div>

            {isLoading && !data ? (
                <div className="flex items-center justify-center py-14 text-white/25">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
            ) : data && data.items.length === 0 ? (
                <EmptyState variant="compact" title="Nothing matches that" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    {data?.items.map((a) => (
                        <div
                            key={a.id}
                            className={`group flex items-center gap-3 p-3 rounded-[11px] border transition-colors duration-300 ${
                                a.achieved
                                    ? "border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                                    : "border-white/[0.05] bg-white/[0.012] hover:border-white/[0.11]"
                            }`}
                        >
                            <span className="relative w-[38px] h-[50px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.04]">
                                {a.game?.cover_url ? (
                                    <Image
                                        src={a.game.cover_url}
                                        alt=""
                                        aria-hidden
                                        width={80}
                                        height={106}
                                        unoptimized
                                        className={`w-full h-full object-cover ${a.achieved ? "" : "grayscale opacity-40"}`}
                                    />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-white/15">
                                        <Gamepad2 className="w-4 h-4" />
                                    </span>
                                )}
                                {!a.achieved && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                                        <Lock className="w-3 h-3 text-white/45" />
                                    </span>
                                )}
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className={`block font-display text-[13px] font-bold truncate ${a.achieved ? "text-white" : "text-white/55"}`}>
                                    {a.display_name ?? "Unnamed achievement"}
                                </span>
                                {a.description && (
                                    <span className={`block mt-0.5 text-[11.5px] leading-snug line-clamp-1 ${a.achieved ? "text-white/40" : "text-white/25"}`}>
                                        {a.description}
                                    </span>
                                )}
                                <span className="mt-1 flex items-center gap-2 font-display text-[9px] font-bold uppercase tracking-[0.11em] text-white/25">
                                    {a.game && (
                                        <Link href={`/games/${a.game.slug}`} className="truncate hover:text-[var(--accent)] transition-colors">
                                            {a.game.name}
                                        </Link>
                                    )}
                                    {a.achieved_at && <span className="shrink-0 tabular-nums">· {dayLabel(a.achieved_at)}</span>}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {data && data.meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                        onClick={() => goToPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="h-8 px-3 rounded-[7px] border border-white/[0.09] bg-white/[0.03] font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 disabled:opacity-30 hover:border-white/25 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/30">
                        {data.meta.page} / {data.meta.last_page}
                    </span>
                    <button
                        onClick={() => goToPage(Math.min(data.meta.last_page, page + 1))}
                        disabled={page >= data.meta.last_page}
                        className="h-8 px-3 rounded-[7px] border border-white/[0.09] bg-white/[0.03] font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 disabled:opacity-30 hover:border-white/25 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
