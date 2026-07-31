"use client";

import Link from "next/link";
import { Gamepad2, Wand2, ListPlus } from "lucide-react";
import type { BacklogSuggestion, DashboardStats } from "@/lib/types/dashboard";

export default function BacklogProgressCard({
    stats,
    suggestion,
}: {
    stats: DashboardStats;
    suggestion: BacklogSuggestion | null;
}) {
    const total = stats.playing_count + stats.backlog_count + stats.completed_count;
    const percent = total > 0 ? Math.round((stats.completed_count / total) * 100) : 0;
    const isEmpty = total === 0;

    // SVG donut geometry
    const r = 42;
    const circumference = 2 * Math.PI * r;
    const dash = (percent / 100) * circumference;

    // A backlog of zero has nothing to chart and the advisor rejects it (422),
    // so show the way in instead of a row of zeros.
    if (isEmpty) {
        return (
            <div className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-5 h-full flex flex-col">
                <h3 className="text-[14px] font-bold text-white mb-3">Backlog Progress</h3>
                <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                    <span className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                        <ListPlus className="w-[18px] h-[18px] text-[var(--accent)]" />
                    </span>
                    <p className="text-[13px] font-semibold text-white/70">Your backlog is empty</p>
                    <p className="text-[11.5px] text-white/35 max-w-[260px]">
                        Add games you plan to play and this turns into a progress tracker — plus AI picks for what to start next.
                    </p>
                    <Link
                        href="/games"
                        className="mt-1 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--accent)] text-white text-[12px] font-bold hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <ListPlus className="w-3.5 h-3.5" /> Build your backlog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-5 h-full flex flex-col">
            <h3 className="text-[14px] font-bold text-white mb-3">Backlog Progress</h3>

            {/* Counters + completion ring */}
            <div className="flex items-center gap-4 rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[26px] font-black text-white leading-none tabular-nums">{stats.backlog_count}</p>
                        <p className="mt-1.5 text-[11px] text-white/40">Total in Backlog</p>
                    </div>
                    <div>
                        <p className="text-[26px] font-black text-white leading-none tabular-nums">{stats.completed_this_month}</p>
                        <p className="mt-1.5 text-[11px] text-white/40">Completed this month</p>
                    </div>
                </div>

                <div className="relative shrink-0 w-[100px] h-[100px]">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                        {/* a round cap on a zero-length dash still paints a dot — skip the arc entirely */}
                        {percent > 0 && (
                            <circle
                                cx="50" cy="50" r={r} fill="none"
                                stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${dash} ${circumference - dash}`}
                            />
                        )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[19px] font-black text-[var(--accent)] tabular-nums leading-none">{percent}%</span>
                        <span className="mt-1 text-[9px] text-white/35">Completed</span>
                    </div>
                </div>
            </div>

            {/* Suggested next from the backlog */}
            {suggestion && (
                <div className="mt-4">
                    <p className="text-[12px] font-bold text-white/70 mb-2">Suggested Next</p>
                    <div className="flex items-center gap-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                        <Link href={`/games/${suggestion.slug}`} prefetch={false} className="relative w-[96px] h-[58px] rounded-lg overflow-hidden shrink-0 bg-white/5">
                            {suggestion.background_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={suggestion.background_image} alt={suggestion.name} loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-white/15" /></span>
                            )}
                        </Link>
                        <div className="min-w-0 flex-1">
                            <Link href={`/games/${suggestion.slug}`} prefetch={false} className="block text-[13.5px] font-bold text-white line-clamp-1 hover:text-[var(--accent)] transition-colors">
                                {suggestion.name}
                            </Link>
                            {suggestion.genres.length > 0 && (
                                <p className="mt-0.5 text-[11px] text-white/40 line-clamp-1">{suggestion.genres.join(" · ")}</p>
                            )}
                            <p className="mt-1 text-[11px] text-emerald-400/80">
                                {suggestion.match_percent !== null
                                    ? `${suggestion.match_percent}% match based on your play history`
                                    : "Next up in your backlog"}
                            </p>
                        </div>
                        <Link
                            href={`/games/${suggestion.slug}`}
                            prefetch={false}
                            className="shrink-0 hidden sm:inline-flex items-center h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-[11.5px] font-bold text-white hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors"
                        >
                            View Game
                        </Link>
                    </div>
                </div>
            )}

            <Link
                href="/backlog-advisor"
                className="mt-auto pt-4 flex items-center justify-center gap-2 h-11 text-[12px] font-bold text-white/70 hover:text-[var(--accent)] transition-colors"
            >
                <span className="flex items-center gap-2 w-full justify-center h-11 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[var(--accent)]/40 transition-colors">
                    <Wand2 className="w-4 h-4" /> Open Backlog Advisor
                </span>
            </Link>
        </div>
    );
}
