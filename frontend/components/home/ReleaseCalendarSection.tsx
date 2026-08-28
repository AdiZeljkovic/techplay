"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import { Gamepad2 } from "lucide-react";

interface CalendarGame {
    id: number;
    slug: string;
    name: string;
    released: string;
    cover_url: string;
    platforms: unknown;
}

const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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
        <Panel
            title="Upcoming releases"
            action={{ label: "Full calendar", href: "/calendar" }}
            padding="none"
        >
            <div className="divide-y divide-white/[0.05]">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3.5 px-4 py-3 animate-pulse">
                            <div className="w-[34px] shrink-0">
                                <div className="h-2.5 w-7 bg-white/[0.06] rounded-[2px] mb-1.5" />
                                <div className="h-4 w-6 bg-white/[0.06] rounded-[2px]" />
                            </div>
                            <div className="w-[46px] h-[46px] bg-white/[0.06] rounded-[var(--radius-card)] shrink-0" />
                            <div className="flex-1">
                                <div className="h-3.5 bg-white/[0.06] rounded-[2px] w-3/4 mb-2" />
                                <div className="h-2.5 bg-white/[0.06] rounded-[2px] w-1/2" />
                            </div>
                        </div>
                    ))
                    : games.map((game) => {
                        const date = new Date(game.released);
                        const day = date.getDate();
                        const month = MONTH_SHORT[date.getMonth()];
                        const platforms = parsePlatforms(game.platforms);

                        return (
                            <Link
                                key={game.id}
                                href={`/games/${game.slug}`}
                                prefetch={false}
                                className="group flex items-center gap-3.5 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                            >
                                {/* the date, read as one block */}
                                <div className="flex flex-col items-center w-[34px] shrink-0">
                                    <span className="font-display text-[9.5px] font-black uppercase tracking-[0.14em] text-[var(--accent)] leading-none">
                                        {month}
                                    </span>
                                    <span className="mt-1 font-display text-[19px] font-black tabular-nums text-white leading-none">
                                        {day}
                                    </span>
                                </div>

                                <div className="relative w-[46px] h-[46px] shrink-0 rounded-[var(--radius-card)] overflow-hidden border border-white/[0.06] bg-black/40">
                                    {game.cover_url ? (
                                        <Image unoptimized
                                            src={game.cover_url}
                                            alt={game.name}
                                            fill
                                            sizes="46px"
                                            quality={60}
                                            className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                                        />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-white/12">
                                            <Gamepad2 className="w-5 h-5" />
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <h4 className="font-display text-[13px] font-black text-white leading-tight truncate group-hover:text-[var(--accent)] transition-colors">
                                        {game.name}
                                    </h4>
                                    {platforms && (
                                        <p className="mt-1 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 truncate">
                                            {platforms}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                }
            </div>
        </Panel>
    );
}
