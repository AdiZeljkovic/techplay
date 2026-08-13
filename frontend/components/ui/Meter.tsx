"use client";

import { cn } from "@/lib/utils";

interface MeterProps {
    value: number;
    max: number;
    /** Above this many steps a segmented bar stops being readable. */
    segmentLimit?: number;
    tone?: string;
    size?: "sm" | "md";
    /** "3 / 10" at the end of the bar. */
    showCount?: boolean;
    label?: string;
    className?: string;
}

/**
 * Progress you can count when there is something to count.
 *
 * Every meter on the profile was one smooth track, including the ones measuring
 * quantities as small as three. "Finish 3 games — 0/3" drawn as an empty bar
 * asks the reader to go and find the numbers; drawn as three empty segments it
 * says the same thing in the shape itself, and the second one lands without
 * being read.
 *
 * The cutoff is real, not decorative: past a dozen steps, counting segments is
 * work rather than reading, and a continuous bar is the honest form. Season
 * progress and XP bands get the bar; quests, goals and achievement steps get
 * the segments.
 */
export default function Meter({
    value, max, segmentLimit = 12, tone, size = "md", showCount = false, label, className = "",
}: MeterProps) {
    const safeMax = Math.max(1, Math.round(max));
    const done = Math.max(0, Math.min(safeMax, Math.round(value)));
    const percent = Math.round((done / safeMax) * 100);
    const height = size === "sm" ? "h-[5px]" : "h-[7px]";
    const fill = tone ?? "var(--accent)";

    const bar = safeMax <= segmentLimit ? (
        <span className="flex flex-1 gap-[3px]" role="presentation">
            {Array.from({ length: safeMax }).map((_, i) => (
                <span
                    key={i}
                    className={cn("flex-1 rounded-[2px] transition-colors duration-500", height)}
                    style={{ background: i < done ? fill : "var(--track)" }}
                />
            ))}
        </span>
    ) : (
        <span className={cn("flex-1 rounded-[2px] bg-[var(--track)] overflow-hidden", height)}>
            <span
                className="block h-full rounded-[2px] transition-[width] duration-700"
                style={{ width: `${percent}%`, background: fill }}
            />
        </span>
    );

    return (
        <div className={cn("min-w-0", className)}>
            {label && (
                <p className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/35 truncate">{label}</span>
                    {showCount && (
                        <span className="shrink-0 font-display text-[10px] font-black tabular-nums text-white/45">
                            {done}<span className="text-white/20">/{safeMax}</span>
                        </span>
                    )}
                </p>
            )}

            <span
                className="flex items-center gap-2.5"
                role="progressbar"
                aria-valuenow={done}
                aria-valuemin={0}
                aria-valuemax={safeMax}
                aria-label={label}
            >
                {bar}
                {showCount && !label && (
                    <span className="shrink-0 font-display text-[10px] font-black tabular-nums text-white/45">
                        {done}<span className="text-white/20">/{safeMax}</span>
                    </span>
                )}
            </span>
        </div>
    );
}
