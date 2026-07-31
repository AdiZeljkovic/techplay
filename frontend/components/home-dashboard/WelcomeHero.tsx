"use client";

import Link from "next/link";
import { Play, LayoutGrid, Bell, CalendarDays, Flame, ArrowRight } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Seven-day streak rail. A running streak is the reason to come back
 * tomorrow, so it gets real estate rather than a line of small print.
 */
function StreakRail({ streak }: { streak: DashboardData["streak"] }) {
    // Monday-indexed position of today, so the lit run ends on the right day.
    const todayIdx = (new Date().getDay() + 6) % 7;
    const lit = Math.min(streak.streak, todayIdx + 1);

    return (
        <div className="rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--fill-1)] p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
                <span className="flex items-center gap-2 min-w-0">
                    <Flame className={`w-4 h-4 shrink-0 ${streak.streak > 0 ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"}`} />
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)] truncate">
                        {streak.streak > 0 ? `${streak.streak}-day streak` : "Start a streak"}
                    </span>
                </span>

                {streak.claimed_today ? (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                        Back tomorrow
                    </span>
                ) : (
                    <Link
                        href="/profile/me"
                        className="group/claim shrink-0 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[var(--accent)] text-white font-display text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300"
                    >
                        +{streak.next_bounty} waiting
                        <ArrowRight className="w-3 h-3 group-hover/claim:translate-x-0.5 transition-transform duration-300" />
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-1.5">
                {DAYS.map((d, i) => {
                    const active = i < lit;
                    const isToday = i === todayIdx;
                    return (
                        <span key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <span
                                className={`w-full h-1.5 rounded-full transition-colors duration-300 ${
                                    active ? "bg-[var(--accent)]" : "bg-[var(--track)]"
                                }`}
                                style={active ? { boxShadow: "0 0 10px color-mix(in srgb, var(--accent) 45%, transparent)" } : undefined}
                            />
                            <span
                                className={`text-[9px] font-bold leading-none ${
                                    isToday ? "text-[var(--ink-hi)]" : "text-[var(--ink-faint)]"
                                }`}
                            >
                                {d}
                            </span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * A zero is not news. When a counter has nothing to report it becomes the
 * invitation that would make it non-zero.
 */
function HighlightChip({
    icon,
    value,
    label,
    emptyLabel,
    href,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    emptyLabel: string;
    href: string;
}) {
    const empty = value === 0;

    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--fill-1)] px-4 py-3 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
        >
            <span className={`shrink-0 ${empty ? "text-[var(--ink-faint)]" : "text-[var(--accent)]"} group-hover:text-[var(--accent)] transition-colors duration-300`}>
                {icon}
            </span>
            {empty ? (
                <span className="min-w-0 text-[11px] text-[var(--ink-low)] leading-tight group-hover:text-[var(--ink-mid)] transition-colors duration-300">
                    {emptyLabel}
                </span>
            ) : (
                <span className="min-w-0">
                    <span className="block font-display text-[17px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{value}</span>
                    <span className="block mt-1 text-[10px] text-[var(--ink-low)] leading-tight whitespace-pre-line">{label}</span>
                </span>
            )}
        </Link>
    );
}

export default function WelcomeHero({ data }: { data: DashboardData }) {
    const { user, playing_now, streak, highlights } = data;
    const firstPlaying = playing_now[0];

    // The user's own game art doubles as the panel backdrop
    const backdrop = firstPlaying?.background_image ?? data.favorites[0]?.background_image ?? null;

    return (
        <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)] h-full">
            {backdrop && (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={backdrop} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.18]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] via-[var(--surface-1)]/92 to-[var(--surface-1)]/65" />
                </>
            )}
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-50 pointer-events-none" />
            <span
                aria-hidden
                className="pointer-events-none absolute -left-24 -top-28 w-[420px] h-[420px] rounded-full opacity-[0.10]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

            <div className="relative p-6 md:p-8 flex flex-col h-full">
                <h1 className="font-display text-[28px] md:text-[36px] font-black text-[var(--ink-hi)] leading-[1.05]">
                    Welcome back, <span className="text-[var(--accent)]">{user.display_name || user.username}.</span>
                </h1>

                {/* Says something true about *this* account, not about the product */}
                <p className="mt-3 text-[14px] text-[var(--ink-mid)] leading-relaxed max-w-lg">
                    {firstPlaying ? (
                        <>
                            You&apos;re playing <span className="text-[var(--ink-hi)] font-semibold">{firstPlaying.name}</span>. Pick up where you left off, or see what&apos;s next for you.
                        </>
                    ) : (
                        <>Track what you play, follow what&apos;s coming, and build a library that actually says something about you.</>
                    )}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                        href={firstPlaying ? `/games/${firstPlaying.slug}` : "/games"}
                        prefetch={false}
                        className="inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        {firstPlaying ? "Continue Playing" : "Find Your First Game"}
                    </Link>
                    <Link
                        href="/profile/me?tab=collection"
                        className="inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                    >
                        <LayoutGrid className="w-4 h-4" /> Open My Library
                    </Link>
                </div>

                {/* Streak owns the middle — the panel no longer hollows out */}
                <div className="mt-7">
                    <StreakRail streak={streak} />
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <HighlightChip
                        icon={<Bell className="w-5 h-5" />}
                        value={highlights.updates_from_followed}
                        label={"new updates\nfrom games you follow"}
                        emptyLabel="Follow games to get their updates here"
                        href="/games"
                    />
                    <HighlightChip
                        icon={<CalendarDays className="w-5 h-5" />}
                        value={highlights.releases_this_week}
                        label={highlights.releases_this_week === 1 ? "release\nthis week" : "releases\nthis week"}
                        emptyLabel="Nothing lands this week — see what's coming"
                        href="/calendar"
                    />
                </div>
            </div>
        </section>
    );
}
