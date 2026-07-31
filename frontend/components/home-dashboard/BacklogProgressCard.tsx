"use client";

import Link from "next/link";
import { Gamepad2, Wand2, ListPlus, ArrowRight } from "lucide-react";
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
            <div className="rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] p-5 h-full flex flex-col">
                <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)] mb-3">Backlog Progress</h3>
                <EmptyState
                    icon={<ListPlus className="w-[18px] h-[18px]" />}
                    title="Your backlog is empty"
                    body="Add games you plan to play and this turns into a progress tracker — plus AI picks for what to start next."
                    action={{ label: "Build your backlog", href: "/games", icon: <ListPlus className="w-3.5 h-3.5" /> }}
                />
            </div>
        );
    }

    return (
        <div className="rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] p-5 h-full flex flex-col">
            <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)] mb-3">Backlog Progress</h3>

            {/* Counters + completion ring */}
            <div className="flex items-center gap-4 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] p-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-display text-[28px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{backlogCount}</p>
                        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Total in Backlog</p>
                    </div>
                    <div>
                        <p className="font-display text-[28px] font-bold text-[var(--accent)] leading-none tabular-nums">{monthCount}</p>
                        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Done this month</p>
                    </div>
                </div>

                <RingMeter value={ringValue} size={100} strokeWidth={8} glow>
                    <span className="font-display text-[20px] font-bold text-[var(--accent)] tabular-nums leading-none">{ringValue}%</span>
                    <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">Cleared</span>
                </RingMeter>
            </div>

            {/* Suggested next from the backlog */}
            {suggestion && (
                <div className="mt-4">
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)] mb-2">
                        <span aria-hidden className="w-1 h-3 rounded-full bg-[var(--accent)]" />
                        Suggested Next
                    </p>
                    <Link
                        href={`/games/${suggestion.slug}`}
                        prefetch={false}
                        className="group relative flex items-center gap-3.5 rounded-[var(--radius-card)] border border-[var(--line)] p-3 overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
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
                                <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] via-[color-mix(in_srgb,var(--surface-1)_88%,transparent)] to-[color-mix(in_srgb,var(--surface-1)_65%,transparent)]" />
                            </>
                        )}
                        {!suggestion.background_image && <span aria-hidden className="absolute inset-0 bg-[var(--fill-1)]" />}

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
                            <span className="block font-display text-[14px] font-bold text-[var(--ink-hi)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-300">
                                {suggestion.name}
                            </span>
                            {suggestion.genres.length > 0 && (
                                <span className="block mt-0.5 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] line-clamp-1">
                                    {suggestion.genres.join(" · ")}
                                </span>
                            )}
                            {suggestion.match_percent !== null ? (
                                <span className="mt-1.5 inline-flex items-center gap-1.5 h-[20px] px-2 rounded-full bg-[color-mix(in_srgb,var(--success)_14%,transparent)] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] text-[10px] font-bold tabular-nums text-[var(--success)]">
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
        </div>
    );
}
