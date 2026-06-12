"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import axios from "@/lib/axios";

interface CalendarGame {
    id: number;
    slug: string;
    name: string;
    released: string;
    background_image: string;
    platforms: unknown;
}

const MONTH_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function parsePlatforms(raw: unknown): string {
    if (!raw) return "";
    if (Array.isArray(raw)) {
        return raw.slice(0, 3).map((item) => {
            if (typeof item === "string") return item.toUpperCase();
            if (item && typeof item === "object") {
                const name = (item as Record<string, unknown>)?.platform
                    ? ((item as Record<string, Record<string, unknown>>).platform?.name as string)
                    : ((item as Record<string, unknown>).name as string);
                return name ? String(name).toUpperCase() : "";
            }
            return "";
        }).filter(Boolean).join(", ");
    }
    if (typeof raw === "string" && raw.startsWith("{")) {
        return raw.replace(/[{}]/g, "").split(",").slice(0, 3).map(s => s.replace(/"/g, "").trim()).join(", ");
    }
    return String(raw).slice(0, 40);
}

export default function UpcomingReleasesWidget() {
    const [games, setGames] = useState<CalendarGame[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await axios.get('/games/calendar');
                setGames((res.data.results || []).slice(0, 5));
            } catch {}
            finally { setLoading(false); }
        }
        load();
    }, []);

    return (
        <div className="rounded-xl overflow-hidden relative" style={{
            background: 'linear-gradient(180deg, #061830 0%, #041225 100%)',
            border: '1px solid #0d2444',
        }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '28px', height: '2px', background: 'var(--accent)' }} />
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #0d2444' }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-[3px] h-4 rounded-full" style={{ background: 'var(--accent, #f97316)' }} />
                    <h3 className="text-white text-[11px] font-black uppercase tracking-[0.14em]">
                        Upcoming Releases
                    </h3>
                </div>
                <Link href="/games/calendar" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    View Calendar <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* List */}
            <div className="py-2">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                            <div className="rounded-lg flex-shrink-0" style={{ width: '44px', height: '54px', background: 'rgba(255,255,255,0.05)' }} />
                            <div className="rounded-md flex-shrink-0" style={{ width: '42px', height: '54px', background: 'rgba(255,255,255,0.05)' }} />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                <div className="h-2 rounded w-2/5" style={{ background: 'rgba(255,255,255,0.05)' }} />
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
                                className="flex items-center gap-3 py-3 group"
                                style={{ borderRadius: '0', borderLeft: '2px solid transparent', paddingLeft: '14px', paddingRight: '16px', transition: 'all 0.15s' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#051830';
                                    e.currentTarget.style.borderLeftColor = 'rgba(249,115,22,0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderLeftColor = 'transparent';
                                }}
                            >
                                {/* Date badge */}
                                <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-lg" style={{
                                    width: '46px',
                                    minHeight: '54px',
                                    background: 'rgba(4,12,26,0.9)',
                                    border: '1px solid rgba(80,130,200,0.22)',
                                }}>
                                    <span className="font-black leading-none" style={{ fontSize: '20px', color: 'var(--accent, #f97316)' }}>{day}</span>
                                    <span className="font-bold uppercase leading-none mt-0.5" style={{ fontSize: '9px', color: 'rgba(249,115,22,0.55)', letterSpacing: '0.1em' }}>{month}</span>
                                </div>

                                {/* Thumbnail */}
                                <div className="flex-shrink-0 relative rounded-md overflow-hidden" style={{
                                    width: '42px',
                                    height: '54px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    {game.background_image ? (
                                        <Image
                                            src={game.background_image}
                                            alt={game.name}
                                            fill
                                            sizes="42px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0d2444 0%, #061526 100%)' }} />
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold leading-snug line-clamp-2 group-hover:text-white transition-colors" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)' }}>
                                        {game.name}
                                    </div>
                                    {platforms && (
                                        <div className="mt-1 font-medium truncate" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em' }}>
                                            {platforms}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}
