import { cn } from "@/lib/utils";
import { getScoreMeta } from "@/lib/score";

interface ScoreBadgeProps {
    /** 0–10 scale */
    score: number;
    /** bar = numeral + verdict word in one 28px rail (deck rows); pill = numeral only */
    variant?: "bar" | "pill";
    className?: string;
}

/**
 * The one review-score treatment. Lives in a card's info deck, never on the
 * artwork — box art carries its own branding and every cover has a different
 * brightness. Tinted, bordered and glowing in its verdict color.
 */
export default function ScoreBadge({ score, variant = "bar", className }: ScoreBadgeProps) {
    const { color, label } = getScoreMeta(score);

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
            className={cn("inline-flex items-center gap-2 h-7 px-2.5 rounded-[var(--radius-inner)] border whitespace-nowrap", className)}
            style={{
                borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                boxShadow: `0 0 14px color-mix(in srgb, ${color} 20%, transparent)`,
            }}
        >
            <span className="font-display text-[14px] font-bold tabular-nums leading-none" style={{ color }}>
                {score.toFixed(1)}
            </span>
            <span aria-hidden className="w-px h-3.5 rounded-full" style={{ backgroundColor: color, opacity: 0.35 }} />
            <span className="text-[7px] font-black uppercase leading-none" style={{ color, letterSpacing: "0.12em", opacity: 0.95 }}>
                {label}
            </span>
        </span>
    );
}
