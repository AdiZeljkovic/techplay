"use client";

import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { PlayingNowCard } from "@/components/profile/dashboard/PlayingNow";
import type { PlayingNowGame } from "@/lib/types/profile";

export default function ContinuePlayingRow({ games }: { games: PlayingNowGame[] }) {
    if (!games.length) return null;

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2.5 text-[15px] font-bold uppercase tracking-[0.08em] text-white font-display">
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    <Play className="w-4 h-4 text-[var(--accent)]" />
                    Continue Playing
                </h2>
                <Link href="/profile/me?tab=collection" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-[var(--accent)] transition-colors">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 xl:mx-0 xl:px-0 scrollbar-none">
                {games.map((g, i) => (
                    <PlayingNowCard
                        key={g.slug}
                        game={g}
                        showResume
                        className={`w-[260px] sm:w-[280px] shrink-0 snap-start tp-fade-up tp-d${Math.min(6, i + 1)}`}
                    />
                ))}
            </div>
        </section>
    );
}
