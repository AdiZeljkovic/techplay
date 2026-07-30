"use client";

import Link from "next/link";
import { Play, LibraryBig, Flame, Sparkles } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";

export default function WelcomeHero({ data }: { data: DashboardData }) {
    const { user, playing_now, streak } = data;
    const firstPlaying = playing_now[0];

    return (
        <section className="relative rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] overflow-hidden p-6 md:p-8 h-full flex flex-col justify-between">
            <span className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-[var(--accent)]/70 via-[var(--accent)]/15 to-transparent" />

            <div>
                <h1 className="font-display text-[28px] md:text-[36px] font-black text-white leading-tight">
                    Welcome back, <span className="text-[var(--accent)]">{user.display_name || user.username}.</span>
                </h1>
                <p className="mt-2 text-[14px] text-white/50 max-w-md">
                    Pick up where you left off, track upcoming releases and discover what matters to you.
                </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                {firstPlaying && (
                    <Link
                        href={`/games/${firstPlaying.slug}`}
                        prefetch={false}
                        className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[var(--accent)] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <Play className="w-4 h-4" /> Continue Playing
                    </Link>
                )}
                <Link
                    href="/profile/me?tab=collection"
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] font-bold uppercase tracking-wider hover:border-[var(--accent)]/40 transition-colors"
                >
                    <LibraryBig className="w-4 h-4" /> Open My Games
                </Link>
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.05] flex flex-wrap items-center gap-x-8 gap-y-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    </span>
                    <div>
                        <p className="text-[12px] font-bold text-white">Daily XP Bonus</p>
                        <p className="text-[11px] text-white/40">
                            {streak.claimed_today ? "Claimed — come back tomorrow" : "Log in daily to keep your streak!"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                        <Flame className="w-4 h-4 text-[var(--accent)]" />
                    </span>
                    <div>
                        <p className="text-[12px] font-bold text-white">Streak</p>
                        <p className="text-[11px] text-white/40">
                            {streak.days > 0 ? `${streak.days} day${streak.days === 1 ? "" : "s"}` : "Start today"}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
