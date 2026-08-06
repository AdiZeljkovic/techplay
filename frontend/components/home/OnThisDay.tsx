"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2 } from "lucide-react";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";

interface AnniversaryGame {
    slug: string;
    name: string;
    cover_url: string | null;
    rating: number;
    released: string | null;
    genres: string[];
    years_ago: number;
}

const fetcher = () =>
    axios.get("/games/on-this-day").then((r) => ({
        results: (r.data?.results ?? []) as AnniversaryGame[],
        date: r.data?.date as string | undefined,
    }));

/** Games that launched on today's date in earlier years, drawn as a timeline. */
export default function OnThisDay() {
    const { data } = useSWR("on-this-day", fetcher, {
        dedupingInterval: 600_000,
        revalidateOnFocus: false,
    });

    const games = data?.results;
    if (games && games.length === 0) return null;

    return (
        <Panel
            title="On This Day"
            action={{ label: "Release calendar", href: "/calendar" }}
            className="h-full"
            bodyClassName="p-4"
        >
            <p className="text-[11px] text-[var(--ink-low)] mb-3.5">
                Gaming history from {data?.date ?? "today"}.
            </p>

            {!games && (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-[62px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />
                    ))}
                </div>
            )}

            <div className="flex flex-col">
                {games?.slice(0, 4).map((g, i, arr) => {
                    const year = g.released ? new Date(g.released).getFullYear() : null;
                    const isLast = i === arr.length - 1;

                    return (
                        <Link
                            key={g.slug}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            className="group flex items-stretch gap-3.5"
                        >
                            {/* year + timeline node */}
                            <span className="w-[42px] shrink-0 pt-3.5 text-right">
                                <span className="block font-display text-[15px] font-bold tabular-nums text-[var(--ink-low)] group-hover:text-[var(--accent)] transition-colors duration-300">
                                    {year ?? "—"}
                                </span>
                            </span>

                            <span className="relative flex flex-col items-center shrink-0 w-2.5">
                                <span className="mt-[18px] w-2.5 h-2.5 rounded-full bg-[var(--line-strong)] ring-4 ring-[var(--surface-1)] group-hover:bg-[var(--accent)] group-hover:shadow-[var(--glow-accent)] transition-all duration-300" />
                                {!isLast && <span className="flex-1 w-px bg-[var(--line)] mt-1" />}
                            </span>

                            {/* content row */}
                            <span className="flex-1 min-w-0 flex items-center gap-3 py-2 pr-1 -mr-1 rounded-[var(--radius-card)] group-hover:bg-[var(--fill-1)] transition-colors duration-300">
                                <span className="relative w-[68px] h-[44px] rounded-[var(--radius-inner)] overflow-hidden shrink-0 bg-[var(--fill-1)] border border-[var(--line)]">
                                    {g.cover_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={g.cover_url}
                                            alt={g.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                        />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-[var(--ink-faint)]">
                                            <Gamepad2 className="w-4 h-4" />
                                        </span>
                                    )}
                                </span>

                                <span className="flex-1 min-w-0">
                                    <span className="block font-display text-[13px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-300">
                                        {g.name}
                                    </span>
                                    <span className="block mt-0.5 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] truncate">
                                        {g.genres.join(" · ") || "Game"}
                                    </span>
                                </span>

                                <span className="shrink-0 text-right pr-2">
                                    <span className="block font-display text-[16px] font-bold tabular-nums text-[var(--accent)] leading-none">
                                        {g.years_ago}
                                    </span>
                                    <span className="block mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                                        {g.years_ago === 1 ? "year" : "years"}
                                    </span>
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </Panel>
    );
}
