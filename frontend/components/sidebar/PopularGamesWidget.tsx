"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import axios from "@/lib/axios";

interface Game {
    id: number;
    slug: string;
    name: string;
    rating: number;
    cover_url: string;
    released?: string;
    genres?: string | string[];
}

function parseFirstGenre(raw: string | string[] | null | undefined): string {
    if (!raw) return "";
    if (Array.isArray(raw)) return raw[0] || "";
    if (typeof raw === "string" && raw.startsWith("{")) {
        return raw.replace(/[{}]/g, "").split(",")[0]?.replace(/"/g, "").trim() || "";
    }
    return String(raw).split(",")[0]?.trim() || "";
}

function scoreColor(score: number): string {
    if (score >= 9) return "#f97316";
    if (score >= 7) return "#22c55e";
    return "#eab308";
}

export default function PopularGamesWidget() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await axios.get('/games?ordering=-rating&page_size=5');
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
                        Popular in Database
                    </h3>
                </div>
                <Link href="/games" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    View All <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* List */}
            <div className="py-2">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                            <div className="rounded-full flex-shrink-0" style={{ width: '26px', height: '26px', background: 'rgba(255,255,255,0.05)' }} />
                            <div className="rounded-md flex-shrink-0" style={{ width: '40px', height: '52px', background: 'rgba(255,255,255,0.05)' }} />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                <div className="h-2 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            </div>
                            <div className="rounded-full flex-shrink-0" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                    ))
                    : games.map((game, idx) => {
                        const year = game.released ? new Date(game.released).getFullYear() : null;
                        const genre = parseFirstGenre(game.genres);
                        const score = game.rating ? game.rating.toFixed(1) : null;
                        const color = score ? scoreColor(parseFloat(score)) : "#f97316";

                        return (
                            <Link
                                key={game.id}
                                href={`/games/${game.slug}`}
                                prefetch={false}
                                className="flex items-center gap-3 py-3 group"
                                style={{ borderLeft: '2px solid transparent', paddingLeft: '14px', paddingRight: '16px', transition: 'all 0.15s' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#051830';
                                    e.currentTarget.style.borderLeftColor = 'rgba(249,115,22,0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderLeftColor = 'transparent';
                                }}
                            >
                                {/* Rank */}
                                <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{
                                    width: '26px',
                                    height: '26px',
                                    border: `1px solid ${color}55`,
                                }}>
                                    <span className="font-black" style={{ fontSize: '11px', color }}>{idx + 1}</span>
                                </div>

                                {/* Cover */}
                                <div className="flex-shrink-0 relative rounded-md overflow-hidden" style={{
                                    width: '42px',
                                    height: '54px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    {game.cover_url ? (
                                        <Image
                                            src={game.cover_url}
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
                                    <div className="font-semibold leading-snug line-clamp-1 group-hover:text-white transition-colors" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                                        {game.name}
                                    </div>
                                    <div className="mt-0.5 font-medium" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.32)' }}>
                                        {[year, genre].filter(Boolean).join(" · ")}
                                    </div>
                                </div>

                                {/* Score */}
                                {score ? (
                                    <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{
                                        width: '34px',
                                        height: '34px',
                                        border: `2px solid ${color}`,
                                        background: `${color}14`,
                                    }}>
                                        <span className="font-black" style={{ fontSize: '10px', color }}>{score}</span>
                                    </div>
                                ) : (
                                    <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{
                                        width: '34px',
                                        height: '34px',
                                        border: '2px solid rgba(255,255,255,0.1)',
                                    }}>
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>—</span>
                                    </div>
                                )}
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}
