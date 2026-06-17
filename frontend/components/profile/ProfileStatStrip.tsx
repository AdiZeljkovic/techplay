"use client";

import { Zap, Flame, Library, Gamepad2, Layers, CheckCircle2, Heart, Trophy, Star, MessageSquare } from "lucide-react";
import type { ProfileStats } from "@/lib/types/profile";

interface Props {
    stats: ProfileStats;
}

export default function ProfileStatStrip({ stats }: Props) {
    const items = [
        { icon: Zap, label: "Level", value: stats.level ?? 0, color: "#FC4100" },
        { icon: Flame, label: "XP", value: (stats.xp ?? 0).toLocaleString(), color: "#fb923c" },
        { icon: Library, label: "Collection", value: stats.games_count ?? 0, color: "#a78bfa" },
        { icon: Gamepad2, label: "Playing", value: stats.playing_count ?? 0, color: "#34d399" },
        { icon: Layers, label: "Backlog", value: stats.backlog_count ?? 0, color: "#60a5fa" },
        { icon: CheckCircle2, label: "Completed", value: stats.completed_count ?? 0, color: "#22c55e" },
        { icon: Heart, label: "Wishlist", value: stats.wishlist_count ?? 0, color: "#f472b6" },
        { icon: Trophy, label: "Achievements", value: stats.achievements_count ?? 0, color: "#facc15" },
        { icon: Star, label: "Reputation", value: (stats.reputation ?? 0).toLocaleString(), color: "#d43600" },
        { icon: MessageSquare, label: "Forum Posts", value: stats.posts_count ?? 0, color: "#FF7A3D" },
    ];

    return (
        <div className="max-w-[1320px] mx-auto px-4 xl:px-0 mt-6">
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
                {items.map((s) => (
                    <div
                        key={s.label}
                        className="group rounded-xl border border-white/[0.05] bg-[var(--bg-card)] p-3 flex flex-col items-center justify-center gap-1.5 hover:border-white/[0.12] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${s.color}1A` }}>
                            <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <span className="text-lg font-black text-white tabular-nums leading-none">{s.value}</span>
                        <span className="text-[8px] uppercase tracking-[0.12em] text-white/35 font-bold text-center leading-tight">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
