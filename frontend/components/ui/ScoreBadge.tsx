import { cn } from "@/lib/utils";
import { getScoreMeta } from "@/lib/score";

interface ScoreBadgeProps {
    /** 0–10 scale */
    score: number;
    /** bar = the numeral itself; pill = a filled chip, for sitting on artwork */
    variant?: "bar" | "pill";
    className?: string;
}

/**
 * The one review-score treatment.
 *
 * No box. The info deck already carries its platform marks bare, so a boxed
 * number beside them was the only fenced-off thing in the row — it read as a
 * sticker pressed onto the card rather than part of it. The numeral is the
 * score: set in the display face, sized to hold its own, and coloured by its
 * verdict band, which is the signal the box was carrying anyway.
 *
 * `pill` stays filled, because it is meant for sitting over artwork where a
 * bare numeral would be at the mercy of whatever is behind it.
 */
export default function ScoreBadge({ score, variant = "bar", className }: ScoreBadgeProps) {
    const { color, label, ink } = getScoreMeta(score);

    if (variant === "pill") {
        return (
            <span
                className={cn(
                    "inline-flex items-center px-2 py-1 rounded-[var(--radius-inner)] font-numeric text-[12px]",
                    className,
                )}
                style={{ backgroundColor: color, color: ink }}
                title={label}
            >
                {score.toFixed(1)}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-baseline font-numeric text-[21px] leading-none",
                className,
            )}
            style={{ color }}
            title={label}
        >
            {score.toFixed(1)}
        </span>
    );
}
