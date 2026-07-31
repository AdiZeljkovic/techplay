import { cn } from "@/lib/utils";
import { getScoreMeta } from "@/lib/score";

interface ScoreBadgeProps {
    /** 0–10 scale */
    score: number;
    variant?: "plate" | "pill";
    /** Numeral size in px; the plate sizes itself around the content. */
    size?: number;
    className?: string;
}

/**
 * The one review-score treatment: a verdict-tinted plate carrying the numeral
 * and its verdict word. Auto-widths to the word — MASTERPIECE is the longest
 * label in the scale and must never spill past the border.
 */
export default function ScoreBadge({ score, variant = "plate", size = 18, className }: ScoreBadgeProps) {
    const { color, label, glow } = getScoreMeta(score);

    if (variant === "pill") {
        return (
            <span
                className={cn("inline-flex items-center px-2 py-1 rounded-[var(--radius-inner)] font-display text-[12px] font-bold tabular-nums text-white", className)}
                style={{ backgroundColor: color }}
            >
                {score.toFixed(1)}
            </span>
        );
    }

    return (
        <span
            className={cn("inline-flex flex-col items-center justify-center rounded-[var(--radius-inner)] border px-2.5 py-1.5 backdrop-blur-md", className)}
            style={{
                borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
                backgroundColor: `color-mix(in srgb, var(--surface-0) 82%, transparent)`,
                boxShadow: `0 0 16px color-mix(in srgb, ${color} 28%, transparent)`,
            }}
        >
            <span
                className="font-display font-bold tabular-nums leading-none"
                style={{ color, fontSize: size }}
            >
                {score.toFixed(1)}
            </span>
            <span
                className="mt-1 font-black uppercase leading-none whitespace-nowrap"
                style={{ color, fontSize: 7, letterSpacing: "0.1em", opacity: 0.9 }}
            >
                {label}
            </span>
        </span>
    );
}
