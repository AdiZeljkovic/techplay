"use client";

import Link from "next/link";
import { Gamepad2, Wand2, ListPlus } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import RingMeter from "@/components/ui/RingMeter";
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
                        <p className="font-display text-[26px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{stats.backlog_count}</p>
                        <p className="mt-1.5 text-[11px] text-[var(--ink-low)]">Total in Backlog</p>
                    </div>
                    <div>
                        <p className="font-display text-[26px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{stats.completed_this_month}</p>
                        <p className="mt-1.5 text-[11px] text-[var(--ink-low)]">Completed this month</p>
                    </div>
                </div>

                <RingMeter value={percent} size={100} strokeWidth={8}>
                    <span className="font-display text-[19px] font-bold text-[var(--accent)] tabular-nums leading-none">{percent}%</span>
                    <span className="mt-1 text-[9px] text-[var(--ink-faint)]">Completed</span>
                </RingMeter>
            </div>

            {/* Suggested next from the backlog */}
            {suggestion && (
                <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-low)] mb-2">Suggested Next</p>
                    <div className="flex items-center gap-3.5 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] p-3">
                        <Link href={`/games/${suggestion.slug}`} prefetch={false} className="relative w-[96px] h-[58px] rounded-lg overflow-hidden shrink-0 bg-[var(--fill-1)]">
                            {suggestion.background_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={suggestion.background_image} alt={suggestion.name} loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-[var(--ink-faint)]" /></span>
                            )}
                        </Link>
                        <div className="min-w-0 flex-1">
                            <Link href={`/games/${suggestion.slug}`} prefetch={false} className="block font-display text-[13px] font-bold text-[var(--ink-hi)] line-clamp-1 hover:text-[var(--accent)] transition-colors">
                                {suggestion.name}
                            </Link>
                            {suggestion.genres.length > 0 && (
                                <p className="mt-0.5 text-[11px] text-[var(--ink-low)] line-clamp-1">{suggestion.genres.join(" · ")}</p>
                            )}
                            <p className="mt-1 text-[11px] text-[color-mix(in_srgb,var(--success)_80%,transparent)]">
                                {suggestion.match_percent !== null
                                    ? `${suggestion.match_percent}% match based on your play history`
                                    : "Next up in your backlog"}
                            </p>
                        </div>
                        <Link
                            href={`/games/${suggestion.slug}`}
                            prefetch={false}
                            className="shrink-0 hidden sm:inline-flex items-center h-9 px-4 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[11px] font-bold uppercase tracking-wider text-[var(--ink-hi)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            View Game
                        </Link>
                    </div>
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
