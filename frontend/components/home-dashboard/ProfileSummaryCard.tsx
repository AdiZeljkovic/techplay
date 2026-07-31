"use client";

import Link from "next/link";
import { User as UserIcon, Gamepad2, Heart, ListChecks, Star, Award, Plus } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";

export default function ProfileSummaryCard({ data }: { data: DashboardData }) {
    const { user, stats, favorites } = data;

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
        <section className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-5 md:p-6 h-full flex flex-col">
            {/* Identity + XP */}
            <div className="flex items-start gap-4">
                <Link href="/profile/me" className="relative shrink-0">
                    {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt={user.display_name} className="w-[84px] h-[84px] rounded-full object-cover border-2 border-white/10" />
                    ) : (
                        <span className="w-[84px] h-[84px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-white/30" />
                        </span>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 w-[14px] h-[14px] rounded-full bg-emerald-500 ring-[3px] ring-[var(--bg-card)]" title="Online" />
                </Link>

                <div className="flex-1 min-w-0">
                    <Link href="/profile/me" className="block text-[20px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                        {user.display_name || user.username}
                    </Link>
                    <p className="mt-1 text-[12.5px] text-white/45">
                        Level {user.level}
                        {user.rank_name && <> <span className="text-white/25 px-0.5">•</span> <span className="text-white/60">{user.rank_name}</span></>}
                    </p>

                    <div className="mt-3.5 h-[9px] rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#FFA04D]"
                            style={{ width: `${xpPercent}%` }}
                        />
                    </div>
                    <p className="mt-2 text-right text-[12px] text-white/45 tabular-nums">
                        {nextXp
                            ? `${user.xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`
                            : `${user.xp.toLocaleString()} XP · Max rank`}
                    </p>
                </div>
            </div>

            {/* Counters — icon + label on one line, value beneath, left aligned */}
            <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 sm:grid-cols-5 gap-x-3 gap-y-4">
                {counters.map((c) => (
                    <div key={c.label} className="min-w-0">
                        <div className="flex items-center gap-1.5 text-white/40">
                            <c.icon className="w-[15px] h-[15px] shrink-0" />
                            <span className="text-[10.5px] leading-tight truncate">{c.label}</span>
                        </div>
                        <p className="mt-1 text-[20px] font-black text-white leading-none tabular-nums">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Favorites — or a nudge to create some, so the panel never bottoms out empty */}
            <div className="mt-5 pt-5 border-t border-white/[0.06] flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-bold text-white">Favorite Games</p>
                    {favorites.length > 0 && (
                        <Link href="/profile/me?tab=collection" className="text-[11.5px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                            View all
                        </Link>
                    )}
                </div>

                {favorites.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2.5">
                        {favorites.slice(0, 5).map((g) => (
                            <Link
                                key={g.slug}
                                href={`/games/${g.slug}`}
                                prefetch={false}
                                title={g.name}
                                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/[0.06] hover:border-[var(--accent)]/50 transition-colors"
                            >
                                {g.background_image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Link
                        href="/games"
                        className="group flex-1 min-h-[104px] flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-[var(--accent)]/40 transition-colors px-4 text-center"
                    >
                        <span className="w-9 h-9 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-[var(--accent)]" />
                        </span>
                        <span className="text-[12.5px] font-semibold text-white/70 group-hover:text-white transition-colors">
                            Star games you love
                        </span>
                        <span className="text-[11px] text-white/35">They&apos;ll show up here for everyone visiting your profile</span>
                    </Link>
                )}
            </div>
        </section>
    );
}
