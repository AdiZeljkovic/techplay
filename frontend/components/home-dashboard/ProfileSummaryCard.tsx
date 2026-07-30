"use client";

import Link from "next/link";
import { User as UserIcon } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";

export default function ProfileSummaryCard({ data }: { data: DashboardData }) {
    const { user, stats, favorites } = data;

    // XP progress toward the next rank; full bar at max rank.
    const nextXp = user.next_rank?.min_xp ?? null;
    const xpPercent = nextXp ? Math.min(100, Math.round((user.xp / nextXp) * 100)) : 100;

    const counters = [
        { label: "Games", value: stats.games_count },
        { label: "Backlog", value: stats.backlog_count },
        { label: "Reviews", value: stats.reviews_count },
        { label: "Achievements", value: stats.achievements_count },
    ];

    return (
        <section className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] overflow-hidden p-5 h-full flex flex-col">
            {/* Identity row */}
            <div className="flex items-center gap-3.5">
                <Link href="/profile/me" className="relative shrink-0">
                    {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt={user.display_name} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--accent)]/40" />
                    ) : (
                        <span className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-white/30" />
                        </span>
                    )}
                </Link>
                <div className="min-w-0">
                    <Link href="/profile/me" className="block text-[16px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                        {user.display_name || user.username}
                    </Link>
                    <p className="text-[12px] text-white/45">
                        Level {user.level}
                        {user.rank_name && <> · <span className="text-white/60">{user.rank_name}</span></>}
                    </p>
                </div>
            </div>

            {/* XP bar */}
            <div className="mt-4">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
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

            {/* Counters */}
            <div className="mt-3 grid grid-cols-4 gap-2">
                {counters.map((c) => (
                    <div key={c.label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-2 py-2.5 text-center">
                        <p className="text-[16px] font-black text-white tabular-nums">{c.value}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Favorites strip */}
            {favorites.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Favorite Games</p>
                        <Link href="/profile/me?tab=collection" className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)]">
                            View all
                        </Link>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                        {favorites.slice(0, 5).map((g) => (
                            <Link key={g.slug} href={`/games/${g.slug}`} prefetch={false} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/[0.06] hover:border-[var(--accent)]/40 transition-colors" title={g.name}>
                                {g.background_image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
