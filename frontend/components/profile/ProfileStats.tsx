"use client";

import { Trophy, MessageSquare, Flame, Star, Pen, Zap } from "lucide-react";
import type { ProfileStats as ProfileStatsType } from "@/lib/types/profile";

interface ProfileStatsProps {
    stats: ProfileStatsType;
    isStaff: boolean;
}

export default function ProfileStats({ stats, isStaff }: ProfileStatsProps) {
    const statItems = [
        { icon: Zap, label: "Level", value: stats.level, color: "text-[var(--accent)]" },
        { icon: Flame, label: "XP", value: stats.xp.toLocaleString(), color: "text-orange-400" },
        { icon: MessageSquare, label: "Threads", value: stats.threads_count, color: "text-blue-400" },
        { icon: MessageSquare, label: "Posts", value: stats.posts_count, color: "text-cyan-400" },
        { icon: Trophy, label: "Achievements", value: stats.achievements_count, color: "text-yellow-400" },
        { icon: Star, label: "Reputation", value: stats.reputation, color: "text-purple-400" },
    ];

    if (isStaff && stats.reviews_count) {
        statItems.push({ icon: Pen, label: "Articles", value: stats.reviews_count, color: "text-emerald-400" });
    }

    return (
        <div className="container mx-auto px-4 max-w-5xl mt-8">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-6 lg:grid-cols-7">
                {statItems.map((stat) => (
                    <div
                        key={stat.label}
                        className="glass-stat rounded-xl p-4 flex flex-col items-center gap-1.5 min-w-[110px] md:min-w-0"
                    >
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{stat.value}</span>
                        <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
