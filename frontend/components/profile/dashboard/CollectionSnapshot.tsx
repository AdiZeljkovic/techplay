"use client";

import { Layers, CheckCircle2, Heart, Star } from "lucide-react";
import type { CollectionSnapshotTile } from "@/lib/types/profile";

const META: Record<string, { icon: any; color: string; fill: boolean }> = {
    backlog: { icon: Layers, color: "#f59e0b", fill: false },
    completed: { icon: CheckCircle2, color: "#22c55e", fill: false },
    wishlist: { icon: Heart, color: "#ef4444", fill: true },
    favorites: { icon: Star, color: "#facc15", fill: true },
};

export default function CollectionSnapshot({ tiles }: { tiles: CollectionSnapshotTile[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map((t) => {
                const meta = META[t.status] ?? META.backlog;
                const Icon = meta.icon;
                return (
                    <div key={t.status} className="relative rounded-[var(--radius-card)] overflow-hidden border border-white/[0.06] bg-[var(--surface-1)] aspect-[4/3] group">
                        {t.cover ? (
                            <img src={t.cover} alt={t.label} className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500" />
                        ) : (
                            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}22, transparent 70%)` }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2.5">
                            <Icon className="w-6 h-6 shrink-0" style={{ color: meta.color }} fill={meta.fill ? meta.color : "none"} strokeWidth={meta.fill ? 1.5 : 2} />
                            <div className="min-w-0">
                                <div className="text-[12px] font-bold uppercase tracking-wide text-white leading-none">{t.label}</div>
                                <div className="text-[10px] text-white/55 mt-1">{t.count} {t.count === 1 ? "Game" : "Games"}</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
