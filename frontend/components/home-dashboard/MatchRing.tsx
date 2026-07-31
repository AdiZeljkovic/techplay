"use client";

import RingMeter from "@/components/ui/RingMeter";

/** Match-percent ring — success-colored RingMeter with the value inside. */
export default function MatchRing({ percent, size = 44 }: { percent: number; size?: number }) {
    return (
        <RingMeter value={percent} size={size} strokeWidth={3} color="var(--success)">
            <span className="font-display text-[11px] font-bold text-[var(--success)] tabular-nums">{percent}%</span>
        </RingMeter>
    );
}
