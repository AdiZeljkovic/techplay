"use client";

import Link from "next/link";
import { Play, LayoutGrid, Bell, CalendarDays, Hexagon } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";

function StatChip({
    icon,
    value,
    label,
    highlight = false,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                highlight
                    ? "border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line-strong)] bg-[var(--fill-1)]"
            }`}
        >
            <span className="shrink-0 text-[var(--accent)]">{icon}</span>
            <div className="min-w-0">
                <p className="font-display text-[17px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{value}</p>
                <p className="mt-1 text-[10px] text-[var(--ink-low)] leading-tight whitespace-pre-line">{label}</p>
            </div>
        </div>
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
                    <img src={backdrop} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.14]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] via-[var(--surface-1)]/92 to-[var(--surface-1)]/70" />
                </>
            )}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

            <div className="relative p-6 md:p-8 flex flex-col justify-between h-full">
                <div>
                    <h1 className="font-display text-[28px] md:text-[36px] font-black text-[var(--ink-hi)] leading-[1.05]">
                        Welcome back, <span className="text-[var(--accent)]">{user.display_name || user.username}.</span>
                    </h1>
                    <p className="mt-3 text-[14px] text-[var(--ink-mid)] leading-relaxed max-w-lg">
                        TechPlay helps you keep up with the games you love.
                        <br className="hidden sm:block" />
                        Continue playing, track releases, and discover what matters to you.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        {firstPlaying ? (
                            <Link
                                href={`/games/${firstPlaying.slug}`}
                                prefetch={false}
                                className="inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                            >
                                <Play className="w-4 h-4 fill-current" /> Continue Playing
                            </Link>
                        ) : (
                            <Link
                                href="/games"
                                className="inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                            >
                                <Play className="w-4 h-4 fill-current" /> Find Your First Game
                            </Link>
                        )}
                        <Link
                            href="/profile/me?tab=collection"
                            className="inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            <LayoutGrid className="w-4 h-4" /> Open My Library
                        </Link>
                    </div>
                </div>

                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatChip
                        icon={<Bell className="w-5 h-5" />}
                        value={String(highlights.updates_from_followed)}
                        label={"new updates\nfrom games you follow"}
                    />
                    <StatChip
                        icon={<CalendarDays className="w-5 h-5" />}
                        value={String(highlights.releases_this_week)}
                        label={highlights.releases_this_week === 1 ? "release\nthis week" : "releases\nthis week"}
                    />
                    <StatChip
                        icon={<Hexagon className="w-5 h-5" />}
                        value={streak.claimed_today ? "Claimed" : `+${streak.next_bounty}`}
                        label={streak.claimed_today ? "daily bonus\nback tomorrow" : "daily bonus\nbounty waiting"}
                        highlight={!streak.claimed_today}
                    />
                </div>
            </div>
        </section>
    );
}
