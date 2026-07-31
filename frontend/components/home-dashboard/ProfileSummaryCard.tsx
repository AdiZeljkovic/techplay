"use client";

import Link from "next/link";
import { User as UserIcon, Gamepad2, Heart, ListChecks, Star, Award } from "lucide-react";
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
                        <img src={user.avatar_url} alt={user.display_name} className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white/10" />
                    ) : (
                        <span className="w-[72px] h-[72px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <UserIcon className="w-7 h-7 text-white/30" />
                        </span>
                    )}
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-[var(--bg-card)]" title="Online" />
                </Link>

                <div className="flex-1 min-w-0 pt-1">
                    <Link href="/profile/me" className="block text-[19px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                        {user.display_name || user.username}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-white/45">
                        Level {user.level}
                        {user.rank_name && <> <span className="text-white/25">•</span> <span className="text-white/60">{user.rank_name}</span></>}
                    </p>

                    <div className="mt-3 h-2 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D]"
                            style={{ width: `${xpPercent}%` }}
                        />
                    </div>
                    <p className="mt-1.5 text-right text-[11px] text-white/40 tabular-nums">
                        {nextXp
                            ? `${user.xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`
                            : `${user.xp.toLocaleString()} XP · Max rank`}
                    </p>
                </div>
            </div>

            {/* Counters */}
            <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 sm:grid-cols-5 gap-3">
                {counters.map((c) => (
                    <div key={c.label} className="flex flex-col items-center text-center gap-1.5">
                        <c.icon className="w-[18px] h-[18px] text-white/35" />
                        <span className="text-[10px] text-white/40 leading-tight">{c.label}</span>
                        <span className="text-[18px] font-black text-white leading-none tabular-nums">{c.value}</span>
                    </div>
                ))}
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
                <div className="mt-5 pt-5 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[13px] font-bold text-white">Favorite Games</p>
                        <Link href="/profile/me?tab=collection" className="text-[11px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                            View all
                        </Link>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {favorites.slice(0, 5).map((g) => (
                            <Link
                                key={g.slug}
                                href={`/games/${g.slug}`}
                                prefetch={false}
                                title={g.name}
                                className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/[0.06] hover:border-[var(--accent)]/50 transition-colors"
                            >
                                {g.background_image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
