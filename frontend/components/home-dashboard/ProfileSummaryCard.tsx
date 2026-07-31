"use client";

import { useState } from "react";
import Link from "next/link";
import { User as UserIcon, Gamepad2, Heart, ListChecks, Star, Award, Plus } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";
import ProgressBar from "@/components/ui/ProgressBar";
import RingMeter from "@/components/ui/RingMeter";
import AddFavoriteInline from "./AddFavoriteInline";

export default function ProfileSummaryCard({ data }: { data: DashboardData }) {
    const { user, stats, favorites } = data;
    const [pickerOpen, setPickerOpen] = useState(false);

    // XP progress toward the next rank; full bar at max rank.
    const nextXp = user.next_rank?.min_xp ?? null;
    const xpPercent = nextXp ? Math.min(100, Math.round((user.xp / nextXp) * 100)) : 100;

    const counters = [
        { label: "Games Tracked", short: "Games",    value: stats.games_count,        icon: Gamepad2,   href: "/profile/me?tab=collection" },
        { label: "Wishlist",      short: "Wishlist", value: stats.wishlist_count,     icon: Heart,      href: "/profile/me?tab=collection" },
        { label: "Backlog",       short: "Backlog",  value: stats.backlog_count,      icon: ListChecks, href: "/profile/me?tab=collection" },
        { label: "Reviews",       short: "Reviews",  value: stats.reviews_count,      icon: Star,       href: "/profile/me?tab=activity" },
        { label: "Achievements",  short: "Trophies", value: stats.achievements_count, icon: Award,      href: "/profile/me?tab=achievements" },
    ];

    return (
        <section className="relative rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] p-6 md:p-8 h-full flex flex-col overflow-hidden">
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-50 pointer-events-none" />
            <span
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-24 w-[380px] h-[380px] rounded-full opacity-[0.10]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />

            {/* Identity + XP — the ring carries the progress, so the avatar *is* the meter */}
            <div className="relative flex items-start gap-4">
                <Link href="/profile/me" className="relative shrink-0 group/av">
                    <RingMeter value={xpPercent} size={92} strokeWidth={4} glow>
                        {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt={user.display_name} className="w-[72px] h-[72px] rounded-full object-cover" />
                        ) : (
                            <span className="w-[72px] h-[72px] rounded-full bg-[var(--surface-2)] border border-[var(--line-strong)] flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-[var(--ink-faint)]" />
                            </span>
                        )}
                    </RingMeter>
                    <span className="absolute bottom-1 right-1 w-[14px] h-[14px] rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]" title="Online" />
                </Link>

                <div className="flex-1 min-w-0 pt-1">
                    <Link href="/profile/me" className="block font-display text-[20px] font-bold text-[var(--ink-hi)] truncate hover:text-[var(--accent)] transition-colors">
                        {user.display_name || user.username}
                    </Link>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] font-display text-[10px] font-bold uppercase tracking-wider tabular-nums text-[var(--accent)]">
                            Level {user.level}
                        </span>
                        {user.rank_name && (
                            <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[10px] font-bold uppercase tracking-wider text-[var(--ink-mid)]">
                                {user.rank_name}
                            </span>
                        )}
                    </div>

                    <ProgressBar value={xpPercent} className="mt-3.5 h-[9px]" />
                    <p className="mt-2 flex items-baseline justify-between gap-2 text-[11px] text-[var(--ink-low)]">
                        <span className="tabular-nums">
                            {nextXp
                                ? `${user.xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`
                                : `${user.xp.toLocaleString()} XP`}
                        </span>
                        {nextXp && user.next_rank ? (
                            <span className="tabular-nums text-[var(--ink-faint)] truncate">
                                {(nextXp - user.xp).toLocaleString()} to {user.next_rank.name}
                            </span>
                        ) : (
                            <span className="text-[var(--ink-faint)]">Max rank</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Counters — one boxed deck, Command Numerals, hairline dividers */}
            <div className="relative mt-5 grid grid-cols-5 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] divide-x divide-[var(--line)] overflow-hidden">
                {counters.map((c) => (
                    <Link
                        key={c.label}
                        href={c.href}
                        title={c.label}
                        className="group min-w-0 px-2 py-3 text-center hover:bg-[var(--fill-2)] transition-colors duration-300"
                    >
                        <c.icon className="w-[15px] h-[15px] mx-auto text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors duration-300" />
                        <p className="mt-1.5 font-display text-[19px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{c.value}</p>
                        <p className="mt-1.5 text-[9px] uppercase tracking-wider text-[var(--ink-faint)] leading-tight truncate">{c.short}</p>
                    </Link>
                ))}
            </div>

            {/* Favorites — or a nudge to create some, so the panel never bottoms out empty */}
            <div className="mt-5 pt-5 border-t border-[var(--line)] flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <p className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">Favorite Games</p>
                    {favorites.length > 0 && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPickerOpen((v) => !v)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                            <Link href="/profile/me?tab=collection" className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors">
                                View all
                            </Link>
                        </div>
                    )}
                </div>

                {favorites.length === 0 ? (
                    <AddFavoriteInline username={user.username} />
                ) : pickerOpen ? (
                    <AddFavoriteInline username={user.username} defaultOpen onDismiss={() => setPickerOpen(false)} />
                ) : (
                    <div className="grid grid-cols-5 gap-2.5">
                        {favorites.slice(0, 5).map((g) => (
                            <Link
                                key={g.slug}
                                href={`/games/${g.slug}`}
                                prefetch={false}
                                title={g.name}
                                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--fill-1)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors"
                            >
                                {g.background_image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
