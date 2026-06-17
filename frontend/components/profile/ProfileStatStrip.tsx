"use client";

import { Star, Flame, Gamepad2, Layers, CheckCircle2, Heart, Trophy, MessageSquare } from "lucide-react";
import type { ProfileStats } from "@/lib/types/profile";

interface Props {
    stats: ProfileStats;
    nextXp?: number | null;
}

export default function ProfileStatStrip({ stats, nextXp }: Props) {
    const items = [
        { icon: Star, label: "Level", value: stats.level ?? 0, color: "#f59e0b", fill: true },
        { icon: Flame, label: "XP", value: (stats.xp ?? 0).toLocaleString(), sub: nextXp ? `/ ${nextXp.toLocaleString()}` : undefined, color: "#FC4100" },
        { icon: Gamepad2, label: "Games in Collection", value: stats.games_count ?? 0, color: "#a78bfa" },
        { icon: Gamepad2, label: "Playing Now", value: stats.playing_count ?? 0, color: "#ef4444" },
        { icon: Layers, label: "Backlog", value: stats.backlog_count ?? 0, color: "#c084fc" },
        { icon: CheckCircle2, label: "Completed", value: stats.completed_count ?? 0, color: "#3b82f6" },
        { icon: Heart, label: "Wishlist", value: stats.wishlist_count ?? 0, color: "#60a5fa" },
        { icon: Trophy, label: "Achievements", value: stats.achievements_count ?? 0, color: "#f59e0b", fill: true },
        { icon: Star, label: "Reputation", value: (stats.reputation ?? 0).toLocaleString(), color: "#FC4100", fill: true },
        { icon: MessageSquare, label: "Forum Posts", value: stats.posts_count ?? 0, color: "#fb923c" },
    ];

    return (
        <div className="max-w-[1320px] mx-auto px-4 xl:px-0 mt-4">
            <div className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10">
                {items.map((s) => (
                    <div
                        key={s.label}
                        className="flex flex-col items-center justify-start text-center gap-1.5 px-2 py-4 border-white/[0.05] border-b lg:border-b-0 lg:border-r lg:last:border-r-0"
                    >
                        <s.icon className="w-5 h-5" style={{ color: s.color }} fill={s.fill ? s.color : "none"} strokeWidth={s.fill ? 1.5 : 2} />
                        <span className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/40 leading-tight min-h-[2.2em] flex items-center justify-center px-1">{s.label}</span>
                        <span className="text-xl md:text-2xl font-black text-white tabular-nums leading-none">
                            {s.value}
                        </span>
                        {s.sub && <span className="text-[10px] font-bold text-white/30 leading-none">{s.sub}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
