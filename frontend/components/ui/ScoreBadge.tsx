import { cn } from "@/lib/utils";
import { getScoreMeta } from "@/lib/score";
import RingMeter from "./RingMeter";

interface ScoreBadgeProps {
    /** 0–10 scale */
    score: number;
    variant?: "ring" | "pill";
    size?: number;
    className?: string;
}

/**
 * The one review-score treatment: verdict-colored ring with the word
 * (MASTERPIECE / GREAT / …) or a compact pill for dense grids.
 */
export default function ScoreBadge({ score, variant = "ring", size = 52, className }: ScoreBadgeProps) {
    const { color, label, glow } = getScoreMeta(score);

    if (variant === "pill") {
        return (
            <span
                className={cn("inline-flex items-center px-2 py-1 rounded-[var(--radius-inner)] text-[12px] font-display font-bold tabular-nums text-white", className)}
                style={{ backgroundColor: color }}
            >
                {score.toFixed(1)}
            </span>
        );
    }

    return (
        <div
            className={cn("flex flex-col items-center justify-center rounded-[var(--radius-card)] border-[1.5px] backdrop-blur-sm", className)}
            style={{
                width: size,
                height: size,
                borderColor: color,
                backgroundColor: "color-mix(in srgb, var(--surface-0) 90%, transparent)",
                boxShadow: `0 0 18px ${glow}`,
            }}
        >
            <span className="font-display text-[19px] font-bold leading-none tabular-nums" style={{ color }}>
                {score.toFixed(1)}
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.1em] mt-0.5" style={{ color }}>
                {label}
            </span>
        </div>
    );
}
