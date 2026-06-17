"use client";

import type { DistributionStat } from "@/lib/types/profile";

interface Props {
    items: DistributionStat[];
    barClassName?: string;
}

/** Labelled horizontal percentage bars (Platforms & Genres, Gamer DNA). */
export default function DistributionBars({ items, barClassName = "bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D]" }: Props) {
    return (
        <div className="space-y-2.5">
            {items.map((it) => (
                <div key={it.name}>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[12px] font-semibold text-white/75 truncate pr-2">{it.name}</span>
                        <span className="text-[10px] font-bold text-white/40 tabular-nums shrink-0">{it.percent}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${Math.max(4, it.percent)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
