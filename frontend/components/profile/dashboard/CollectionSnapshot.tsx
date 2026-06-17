"use client";

import { Layers, CheckCircle2, Heart, Star } from "lucide-react";
import type { CollectionSnapshotTile } from "@/lib/types/profile";

const ICONS: Record<string, any> = {
    backlog: Layers,
    completed: CheckCircle2,
    wishlist: Heart,
    favorites: Star,
};

export default function CollectionSnapshot({ tiles }: { tiles: CollectionSnapshotTile[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map((t) => {
                const Icon = ICONS[t.status] ?? Layers;
                return (
                    <div key={t.status} className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14] aspect-[4/3] group">
                        {t.cover ? (
                            <img src={t.cover} alt={t.label} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500" />
                        ) : (
                            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 30%, ${t.color}22, transparent 70%)` }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                        <div className="absolute inset-0 p-3 flex flex-col justify-between">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${t.color}26` }}>
                                <Icon className="w-4 h-4" style={{ color: t.color }} />
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: t.color }}>{t.label}</div>
                                <div className="text-[13px] font-black text-white tabular-nums leading-none mt-0.5">{t.count} <span className="text-[10px] font-semibold text-white/50">{t.count === 1 ? "Game" : "Games"}</span></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
