"use client";

import { useState } from "react";
import Link from "next/link";
import { User as UserIcon, Gamepad2, Heart, ListChecks, Star, Award, Plus } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";
import ProgressBar from "@/components/ui/ProgressBar";
import AddFavoriteInline from "./AddFavoriteInline";

export default function ProfileSummaryCard({ data }: { data: DashboardData }) {
    const { user, stats, favorites } = data;
    const [pickerOpen, setPickerOpen] = useState(false);

    // XP progress toward the next rank; full bar at max rank.
    const nextXp = user.next_rank?.min_xp ?? null;
    const xpPercent = nextXp ? Math.min(100, Math.round((user.xp / nextXp) * 100)) : 100;

    const counters = [
        { label: "Games Tracked", value: stats.games_count, icon: Gamepad2 },
        { label: "Wishlist", value: stats.wishlist_count, icon: Heart },
        { label: "Backlog", value: stats.backlog_count, icon: ListChecks },
        { label: "Reviews", value: stats.reviews_count, icon: Star },
        { label: "Achievements", value: stats.achievements_count, icon: Award },
    ];

    return (
        <section className="relative rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] p-6 md:p-8 h-full flex flex-col overflow-hidden">
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
            {/* Identity + XP */}
            <div className="flex items-start gap-4">
                <Link href="/profile/me" className="relative shrink-0">
                    {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt={user.display_name} className="w-[84px] h-[84px] rounded-full object-cover border-2 border-[var(--line-strong)]" />
                    ) : (
                        <span className="w-[84px] h-[84px] rounded-full bg-[var(--surface-2)] border border-[var(--line-strong)] flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-[var(--ink-faint)]" />
                        </span>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 w-[14px] h-[14px] rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]" title="Online" />
                </Link>

                <div className="flex-1 min-w-0">
                    <Link href="/profile/me" className="block font-display text-[20px] font-bold text-[var(--ink-hi)] truncate hover:text-[var(--accent)] transition-colors">
                        {user.display_name || user.username}
                    </Link>
                    <p className="mt-1 text-[13px] text-[var(--ink-low)]">
                        Level {user.level}
                        {user.rank_name && <> <span className="text-[var(--ink-faint)] px-0.5">•</span> <span className="text-[var(--ink-mid)]">{user.rank_name}</span></>}
                    </p>

                    <ProgressBar value={xpPercent} className="mt-3.5 h-[9px]" />
                    <p className="mt-2 text-right text-[12px] text-[var(--ink-low)] tabular-nums">
                        {nextXp
                            ? `${user.xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`
                            : `${user.xp.toLocaleString()} XP · Max rank`}
                    </p>
                </div>
            </div>

            {/* Counters — icon + label on one line, value beneath, left aligned */}
            <div className="mt-5 pt-5 border-t border-[var(--line)] grid grid-cols-3 sm:grid-cols-5 gap-x-3 gap-y-4">
                {counters.map((c) => (
                    <div key={c.label} className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[var(--ink-low)]">
                            <c.icon className="w-[15px] h-[15px] shrink-0" />
                            <span className="text-[10px] leading-tight truncate">{c.label}</span>
                        </div>
                        <p className="mt-1 font-display text-[20px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{c.value}</p>
                    </div>
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
