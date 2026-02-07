"use client";

import { Trophy, MessageSquare, Flame, Star, Pen, Zap } from "lucide-react";
import type { ProfileStats as ProfileStatsType } from "@/lib/types/profile";

interface ProfileStatsProps {
    stats: ProfileStatsType;
    isStaff: boolean;
}

export default function ProfileStats({ stats, isStaff }: ProfileStatsProps) {
    const statItems = [
        { icon: Zap, label: "Level", value: stats.level, color: "text-[var(--accent)]", glow: "rgba(252,65,0,0.3)" },
        { icon: Flame, label: "XP", value: stats.xp.toLocaleString(), color: "text-orange-400", glow: "rgba(251,146,60,0.3)" },
        { icon: MessageSquare, label: "Threads", value: stats.threads_count, color: "text-blue-400", glow: "rgba(96,165,250,0.3)" },
        { icon: MessageSquare, label: "Posts", value: stats.posts_count, color: "text-cyan-400", glow: "rgba(34,211,238,0.3)" },
        { icon: Trophy, label: "Achievements", value: stats.achievements_count, color: "text-yellow-400", glow: "rgba(250,204,21,0.3)" },
        { icon: Star, label: "Reputation", value: stats.reputation, color: "text-purple-400", glow: "rgba(192,132,252,0.3)" },
    ];

    if (isStaff && stats.reviews_count) {
        statItems.push({ icon: Pen, label: "Articles", value: stats.reviews_count, color: "text-emerald-400", glow: "rgba(52,211,153,0.3)" });
    }

    return (
        <div className="relative bg-[var(--bg-secondary)] border-y border-white/5">
            {/* HUD grid pattern */}
            <div className="absolute inset-0 profile-grid-bg opacity-40" />

            <div className="relative container mx-auto px-4 max-w-5xl">
                <div className="flex items-stretch overflow-x-auto no-scrollbar snap-x snap-mandatory">
                    {statItems.map((stat, i) => (
                        <div
                            key={stat.label}
                            className={`group flex-1 min-w-[100px] snap-start flex items-center justify-center py-4 md:py-5 transition-all hover:bg-white/[0.03] ${
                                i > 0 ? "border-l border-white/[0.06]" : ""
                            }`}
                        >
                            <div className="flex flex-col items-center gap-1 px-3">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <stat.icon
                                        className={`w-4 h-4 ${stat.color} transition-all group-hover:drop-shadow-[0_0_6px_var(--tw-shadow-color)]`}
                                        style={{ "--tw-shadow-color": stat.glow } as any}
                                    />
                                </div>
                                <span className="text-xl md:text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                                    {stat.value}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mt-0.5">
                                    {stat.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
