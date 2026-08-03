"use client";

import Link from "next/link";
import { Gamepad2, Wand2, ListPlus, ArrowRight, Swords } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import RingMeter from "@/components/ui/RingMeter";
import { useCountUp } from "@/hooks/useCountUp";
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

    // the ring draws and the counters climb together
    const ringValue = useCountUp(percent, 1100);
    const backlogCount = useCountUp(stats.backlog_count, 900);
    const monthCount = useCountUp(stats.completed_this_month, 900);

    // A backlog of zero has nothing to chart and the advisor rejects it (422),
    // so show the way in instead of a row of zeros.
    if (isEmpty) {
        return (
            <Panel
                title="Campaign Progress"
                icon={<Swords className="w-4 h-4 text-[var(--accent)]" />}
                className="h-full flex flex-col"
                bodyClassName="p-5 flex-1 flex flex-col"
            >
                <EmptyState
                    icon={<ListPlus className="w-[18px] h-[18px]" />}
                    title="Your backlog is empty"
                    body="Add games you plan to play and this turns into a progress tracker — plus AI picks for what to start next."
                    action={{ label: "Build your backlog", href: "/games", icon: <ListPlus className="w-3.5 h-3.5" /> }}
                />
            </Panel>
        );
    }

    return (
        <Panel
            title="Campaign Progress"
            icon={<Swords className="w-4 h-4 text-[var(--accent)]" />}
            variant="console"
            className="h-full flex flex-col"
            bodyClassName="p-5 flex-1 flex flex-col"
        >
            {/* Counters + completion ring */}
            <div className="flex items-center gap-4 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-display text-[28px] font-black text-white leading-none tabular-nums">{backlogCount}</p>
                        <p className="mt-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">In Backlog</p>
                    </div>
                    <div>
                        <p className="font-display text-[28px] font-black text-[var(--accent)] leading-none tabular-nums">{monthCount}</p>
                        <p className="mt-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">Done this month</p>
                    </div>
                </div>

                <RingMeter value={ringValue} size={100} strokeWidth={8} glow>
                    <span className="font-display text-[20px] font-black text-[var(--accent)] tabular-nums leading-none">{ringValue}%</span>
                    <span className="mt-1 font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/40">Cleared</span>
                </RingMeter>
            </div>

            {/* Suggested next from the backlog */}
            {suggestion && (
                <div className="mt-4">
                    <p className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-2">
                        <span aria-hidden className="w-1 h-3 rounded-full bg-[var(--accent)]" />
                        Suggested Next
                    </p>
                    <Link
                        href={`/games/${suggestion.slug}`}
                        prefetch={false}
                        className="group relative flex items-center gap-3.5 rounded-[12px] border border-white/[0.07] p-3 overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                    >
                        {/* the pick's own art, faint, as the row's backdrop */}
                        {suggestion.background_image && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={suggestion.background_image}
                                    alt=""
                                    aria-hidden
                                    className="absolute inset-0 w-full h-full object-cover opacity-[0.14] group-hover:opacity-[0.22] transition-opacity duration-500"
                                />
                                {/* scrim in the console's own face colour, not --surface-1 */}
                                <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0e0c0b] via-[#0e0c0be0] to-[#0e0c0ba6]" />
                            </>
                        )}
                        {!suggestion.background_image && <span aria-hidden className="absolute inset-0 bg-white/[0.02]" />}

                        <span className="relative w-[96px] h-[58px] rounded-[var(--radius-inner)] overflow-hidden shrink-0 bg-[var(--fill-1)] border border-[var(--line)]">
                            {suggestion.background_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={suggestion.background_image}
                                    alt={suggestion.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-[var(--ink-faint)]" /></span>
                            )}
                        </span>

                        <span className="relative min-w-0 flex-1">
                            <span className="block font-display text-[14px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-300">
                                {suggestion.name}
                            </span>
                            {suggestion.genres.length > 0 && (
                                <span className="block mt-0.5 font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/35 line-clamp-1">
                                    {suggestion.genres.join(" · ")}
                                </span>
                            )}
                            {/* taste-match is progression data — it wears violet */}
                            {suggestion.match_percent !== null ? (
                                <span className="mt-1.5 inline-flex items-center gap-1.5 h-[20px] px-2 rounded-full bg-[color-mix(in_srgb,var(--xp)_14%,transparent)] border border-[color-mix(in_srgb,var(--xp)_32%,transparent)] font-display text-[10px] font-black tabular-nums text-[var(--xp-bright)]">
                                    {suggestion.match_percent}% match
                                </span>
                            ) : (
                                <span className="block mt-1.5 text-[11px] text-[var(--ink-low)]">Next up in your backlog</span>
                            )}
                        </span>

                        <ArrowRight className="relative w-4 h-4 shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all duration-300" />
                    </Link>
                </div>
            )}

            <div className="mt-auto pt-4">
                <Link
                    href="/backlog-advisor"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[11px] font-bold uppercase tracking-wider text-[var(--ink-hi)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                >
                    <Wand2 className="w-4 h-4" /> Open Backlog Advisor
                </Link>
            </div>
        </Panel>
    );
}
