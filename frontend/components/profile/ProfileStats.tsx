"use client";

import { Trophy, MessageSquare, Flame, Star, Pen, Zap } from "lucide-react";
import type { ProfileStats as ProfileStatsType } from "@/lib/types/profile";

interface ProfileStatsProps {
    stats: ProfileStatsType;
    isStaff: boolean;
}

export default function ProfileStats({ stats, isStaff }: ProfileStatsProps) {
    const statItems = [
        { icon: Zap, label: "Level", value: stats.level, color: "#FC4100", bg: "rgba(252,65,0,0.08)" },
        { icon: Flame, label: "XP", value: stats.xp.toLocaleString(), color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
        { icon: MessageSquare, label: "Threads", value: stats.threads_count, color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
        { icon: MessageSquare, label: "Posts", value: stats.posts_count, color: "#22d3ee", bg: "rgba(34,211,238,0.08)" },
        { icon: Trophy, label: "Achievements", value: stats.achievements_count, color: "#facc15", bg: "rgba(250,204,21,0.08)" },
        { icon: Star, label: "Reputation", value: stats.reputation, color: "#c084fc", bg: "rgba(192,132,252,0.08)" },
    ];

    if (isStaff && stats.reviews_count) {
        statItems.push({ icon: Pen, label: "Articles", value: stats.reviews_count, color: "#34d399", bg: "rgba(52,211,153,0.08)" });
    }

    return (
        <div className="relative bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]">
            {/* Subtle top line accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent" />

            <div className="relative container mx-auto px-4 max-w-5xl py-5 md:py-6">
                <div className="grid grid-cols-3 md:flex md:items-stretch gap-2.5 md:gap-3">
                    {statItems.map((stat) => (
                        <div
                            key={stat.label}
                            className="group relative rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-3 md:p-4 md:flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04] overflow-hidden"
                        >
                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                                style={{ background: `radial-gradient(circle at 50% 0%, ${stat.bg}, transparent 70%)` }}
                            />

                            {/* Colored top accent line */}
                            <div
                                className="absolute top-0 left-2 right-2 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ backgroundColor: stat.color }}
                            />

                            <div className="relative flex flex-col items-center gap-1">
                                {/* Icon in subtle circle */}
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-0.5 transition-transform duration-300 group-hover:scale-110"
                                    style={{ backgroundColor: stat.bg }}
                                >
                                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                </div>

                                {/* Value */}
                                <span className="text-xl md:text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                                    {stat.value}
                                </span>

                                {/* Label */}
                                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-white/35 font-semibold">
                                    {stat.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom fade line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>
    );
}
