"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import { CalendarDays } from "lucide-react";

import { rawName } from "./DiscoverGames";

interface CalendarGame {
    slug: string;
    name: string;
    released: string | null;
    background_image: string | null;
    genres?: (string | { name?: string } | null)[];
    platforms?: (string | { platform?: { name?: string } } | null)[];
}

const fetcher = () =>
    axios.get("/games/calendar").then((r) => (r.data?.results ?? []) as CalendarGame[]);

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function ComingThisWeek() {
    const { data: games } = useSWR("coming-this-week", fetcher, {
        dedupingInterval: 300_000,
        revalidateOnFocus: false,
    });

    const upcoming = (games ?? []).filter((g) => g.released).slice(0, 4);

    return (
        <SectionCard
            title="Coming This Week"
            icon={<CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "View full calendar", href: "/calendar" }}
            bodyClassName="space-y-2"
        >
            {!games && (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-[64px] rounded-xl bg-white/5 animate-pulse" />)}
                </div>
            )}
            {games && upcoming.length === 0 && (
                <p className="py-6 text-center text-[13px] text-white/35">No releases on the radar right now.</p>
            )}
            {upcoming.map((g) => {
                const date = new Date(g.released!);
                return (
                    <Link
                        key={g.slug}
                        href={`/games/${g.slug}`}
                        prefetch={false}
                        className="group flex items-center gap-3.5 p-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                    >
                        <div className="relative w-[76px] h-[48px] rounded-lg overflow-hidden shrink-0 bg-white/5">
                            {g.background_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-4 h-4" /></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{g.name}</p>
                            <p className="text-[10px] uppercase tracking-wide text-white/40 mt-0.5 line-clamp-1">
                                {(g.platforms ?? []).map(rawName).filter(Boolean).slice(0, 3).join(" · ")}
                                {g.genres?.length && rawName(g.genres[0]) ? ` · ${rawName(g.genres[0])}` : ""}
                            </p>
                        </div>
                        <div className="shrink-0 w-11 text-center rounded-lg bg-white/[0.04] border border-white/[0.06] py-1.5 group-hover:border-[var(--accent)]/30 transition-colors">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">{MONTHS[date.getMonth()]}</p>
                            <p className="text-[15px] font-black text-white leading-tight tabular-nums">{date.getDate()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-[var(--accent)] transition-colors shrink-0" />
                    </Link>
                );
            })}
        </SectionCard>
    );
}
