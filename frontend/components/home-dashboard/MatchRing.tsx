"use client";

import RingMeter from "@/components/ui/RingMeter";

/**
 * Match-percent ring. Violet, not accent or success — taste-match is
 * progression-flavoured data, and --xp is the progression colour.
 */
export default function MatchRing({ percent, size = 44 }: { percent: number; size?: number }) {
    return (
        <RingMeter value={percent} size={size} strokeWidth={3} color="var(--xp)">
            <span className="font-display text-[11px] font-black text-[var(--xp-bright)] tabular-nums">{percent}%</span>
        </RingMeter>
    );
}
