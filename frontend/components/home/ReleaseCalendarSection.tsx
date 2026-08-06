"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "@/lib/axios";

interface CalendarGame {
    id: number;
    slug: string;
    name: string;
    released: string;
    cover_url: string;
    platforms: unknown;
}

const MONTH_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function parsePlatforms(raw: unknown): string {
    if (!raw) return "";
    if (Array.isArray(raw)) {
        return raw.slice(0, 3).map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
                const name = (item as Record<string, unknown>)?.platform
                    ? ((item as Record<string, Record<string, unknown>>).platform?.name as string)
                    : ((item as Record<string, unknown>).name as string);
                return name ? String(name) : "";
            }
            return "";
        }).filter(Boolean).join(" · ");
    }
    if (typeof raw === "string" && raw.startsWith("{")) {
        return raw.replace(/[{}]/g, "").split(",").slice(0, 3).map(s => s.replace(/"/g, "").trim()).join(" · ");
    }
    return String(raw).slice(0, 40);
}

export default function ReleaseCalendarSection() {
    const [games, setGames] = useState<CalendarGame[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/games/calendar')
            .then(res => { setGames((res.data.results || []).slice(0, 5)); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <aside className="w-full h-full flex flex-col bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/20 dark:via-tp-accent/40 to-transparent" />
            <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-tp-accent/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-end justify-between font-sans mb-8 relative z-10">
                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">UPCOMING RELEASES</h2>
            </div>

            <div className="flex flex-col px-1 relative z-10 flex-1">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`flex items-center gap-[22px] py-[16px] animate-pulse ${i !== 4 ? 'border-b border-zinc-200 dark:border-white/[0.04]' : ''}`}>
                            <div className="w-[36px] h-[44px] bg-white/5 rounded shrink-0" />
                            <div className="w-[54px] h-[54px] bg-white/5 rounded-[8px] shrink-0" />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="h-[14px] bg-white/5 rounded w-3/4" />
                                <div className="h-[10px] bg-white/5 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                    : games.map((game, i) => {
                        const date = new Date(game.released);
                        const day = date.getDate();
                        const month = MONTH_SHORT[date.getMonth()];
                        const platforms = parsePlatforms(game.platforms);

                        return (
                            <Link
                                key={game.id}
                                href={`/games/${game.slug}`}
                                prefetch={false}
                                className={`group flex items-center gap-[22px] py-[16px] ${i !== games.length - 1 ? 'border-b border-zinc-200 dark:border-white/[0.04]' : ''}`}
                            >
                                {/* Date column */}
                                <div className="flex flex-col items-center justify-center w-[36px] shrink-0 text-center">
                                    <span className="text-tp-accent text-[12px] font-bold uppercase tracking-widest leading-none mb-1">{month}</span>
                                    <span className="font-display text-[22px] font-medium text-zinc-900 dark:text-white leading-none">{day}</span>
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-[54px] h-[54px] overflow-hidden rounded-[8px] opacity-90 group-hover:opacity-100 shrink-0 border border-zinc-200 dark:border-white/5">
                                    {game.cover_url ? (
                                        <Image
                                            src={game.cover_url}
                                            alt={game.name}
                                            fill
                                            sizes="54px"
                                            quality={60}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[#1A1F26]" />
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex flex-col min-w-0 pr-2 pt-[2px]">
                                    <h4 className="font-sans font-medium text-[15px] text-zinc-800 dark:text-[#E4E4E5] truncate group-hover:text-tp-accent transition-colors leading-[1.2] mb-2">
                                        {game.name}
                                    </h4>
                                    {platforms && (
                                        <div className="text-[11px] text-zinc-500 dark:text-[#8B949E] font-bold tracking-widest uppercase truncate">
                                            {platforms}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                }
            </div>

            {/* CTA Button */}
            <Link
                href="/calendar"
                className="mt-8 bg-tp-accent hover:bg-tp-accent-hover text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-tp-accent/20 relative z-10"
            >
                VIEW FULL CALENDAR
            </Link>
        </aside>
    );
}
