"use client";

import Link from "next/link";
import { Gamepad2, Clock } from "lucide-react";
import type { PlayingNowGame } from "@/lib/types/profile";

function platformLabel(names: string[]): string | null {
    const s = (names?.[0] || "").toLowerCase();
    if (!s) return null;
    if (s.includes("playstation 5") || s === "ps5") return "PS5";
    if (s.includes("playstation")) return "PS";
    if (s.includes("xbox series")) return "SERIES";
    if (s.includes("xbox")) return "XBOX";
    if (s.includes("switch") || s.includes("nintendo")) return "SWITCH";
    if (s.includes("pc") || s.includes("windows")) return "PC";
    return names[0];
}

const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-1 rounded bg-black/60 text-white/90 backdrop-blur-sm">{children}</span>
);

export function PlayingNowCard({ game: g, showResume = false, className = "" }: { game: PlayingNowGame; showResume?: boolean; className?: string }) {
    const plat = platformLabel(g.platform_names);
    return (
        <Link
            href={`/games/${g.slug}`}
            prefetch={false}
            className={`group relative rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300 ${className}`}
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-1)]">
                {g.background_image ? (
                    <img src={g.background_image} alt={g.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-8 h-8" /></div>
                )}
                <div className="absolute inset-0 scrim-card" />

                {/* corner platform badge */}
                {plat && <div className="absolute top-2 right-2"><Badge>{plat}</Badge></div>}

                {/* bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-display text-[14px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{g.name}</h4>
                        {plat && <Badge>{plat}</Badge>}
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-white/60 shrink-0">
                            <Clock className="w-3 h-3" /> {g.hours_played}h
                        </span>
                        <div className="flex-1 h-1.5 bg-[var(--track)] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] rounded-full" style={{ width: `${g.progress}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-white/90 tabular-nums shrink-0">{g.progress}%</span>
                    </div>
                    {/* visual affordance only — the whole card is the link */}
                    {showResume && (
                        <span className="mt-2.5 flex items-center justify-center h-8 rounded-lg bg-[var(--accent)] text-white text-[11px] font-bold uppercase tracking-wider group-hover:bg-[var(--accent-hover)] transition-colors">
                            Resume
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function PlayingNow({ games }: { games: PlayingNowGame[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {games.map((g) => (
                <PlayingNowCard key={g.slug} game={g} />
            ))}
        </div>
    );
}
