"use client";

import type { DistributionStat } from "@/lib/types/profile";

interface Props {
    items: DistributionStat[];
    barClassName?: string;
    /** Per-bar color override (e.g. leaders orange, tail green). Wins over barClassName. */
    colorFn?: (item: DistributionStat, index: number, total: number) => string;
    /** "inline" = label · bar · % on one row; "stacked" = label/% above bar. */
    inline?: boolean;
}

export default function DistributionBars({ items, barClassName = "bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D]", colorFn, inline }: Props) {
    if (inline) {
        return (
            <div className="space-y-2.5">
                {items.map((it, i) => (
                    <div key={it.name} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-[12px] font-medium text-white/70 truncate">{it.name}</span>
                        <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${colorFn ? "" : barClassName}`}
                                style={{ width: `${Math.max(3, it.percent)}%`, ...(colorFn ? { background: colorFn(it, i, items.length) } : {}) }}
                            />
                        </div>
                        <span className="w-9 text-right text-[11px] font-bold text-white/45 tabular-nums">{it.percent}%</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {items.map((it, i) => (
                <div key={it.name}>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[12px] font-semibold text-white/75 truncate pr-2">{it.name}</span>
                        <span className="text-[10px] font-bold text-white/40 tabular-nums shrink-0">{it.percent}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${colorFn ? "" : barClassName}`}
                            style={{ width: `${Math.max(4, it.percent)}%`, ...(colorFn ? { background: colorFn(it, i, items.length) } : {}) }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
