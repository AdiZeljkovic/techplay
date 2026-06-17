"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import type { PlayingNowGame } from "@/lib/types/profile";

export default function PlayingNow({ games }: { games: PlayingNowGame[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {games.map((g) => (
                <Link
                    key={g.slug}
                    href={`/games/${g.slug}`}
                    className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14] hover:border-[var(--accent)]/40 transition-all"
                >
                    <div className="relative aspect-video overflow-hidden bg-[#0B0E14]">
                        {g.background_image ? (
                            <img src={g.background_image} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-8 h-8" /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        {g.platform_names?.[0] && (
                            <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-1 rounded bg-black/60 text-white/80 backdrop-blur-sm">
                                {g.platform_names[0]}
                            </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h4 className="text-[13px] font-bold text-white line-clamp-1 mb-1.5 group-hover:text-[var(--accent)] transition-colors">{g.name}</h4>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D] rounded-full" style={{ width: `${g.progress}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-white/70 tabular-nums">{g.progress}%</span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
