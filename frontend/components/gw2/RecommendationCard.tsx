"use client";

import { AlertTriangle, Clock } from "lucide-react";
import Chip from "@/components/ui/Chip";
import { CONFIDENCE_LABEL, EFFORT_LABEL, type Recommendation } from "@/lib/gw2";

/**
 * One recommendation.
 *
 * Two things on this card are the product, not decoration.
 *
 * **The confidence chip.** The mockup writes "Confidence to complete: High" beside
 * a figure nothing computes, and the rule taken from that is that a claim carries
 * its own certainty or it is not drawn. `Confirmed` means the game's API states
 * it outright; `Worth a look` means the advice is phrased as a question because we
 * are not sure. Those are different promises and they look different.
 *
 * **The blockers.** A recommendation the player cannot act on yet is the more
 * useful of the two — "infusions only socket into ascended gear" is the sentence
 * that saves an evening. So a blocked card is drawn, drawn plainly, and simply
 * ranks below something they can go and do now.
 */

const CONFIDENCE_VARIANT: Record<Recommendation["confidence"], "success" | "accent" | "neutral" | "warning"> = {
    confirmed: "success",
    high: "accent",
    medium: "neutral",
    needs_confirmation: "warning",
};

export default function RecommendationCard({
    recommendation,
    featured = false,
}: {
    recommendation: Recommendation;
    featured?: boolean;
}) {
    const { title, body, confidence, effort, blockers, domain } = recommendation;

    return (
        <article
            className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border p-4"
            style={{
                background: "var(--surface-2)",
                // One lit surface per column. A featured card earns the accent
                // edge; the rest stay quiet so it still means something.
                borderColor: featured
                    ? "color-mix(in srgb, var(--accent) 30%, transparent)"
                    : "var(--line-strong)",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,${featured ? "0.09" : "0.07"})`,
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                <Chip variant={CONFIDENCE_VARIANT[confidence]} size="sm">
                    {CONFIDENCE_LABEL[confidence]}
                </Chip>
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">{domain}</span>
                {effort && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--ink-low)]">
                        <Clock size={11} aria-hidden />
                        {EFFORT_LABEL[effort] ?? effort}
                    </span>
                )}
            </div>

            <h3 className="font-display text-base leading-snug text-[var(--ink-hi)] text-balance">{title}</h3>

            <p className="text-sm leading-relaxed text-[var(--ink-mid)]">{body}</p>

            {blockers.length > 0 && (
                <ul className="mt-auto space-y-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                    {blockers.map((blocker) => (
                        <li key={blocker} className="flex gap-2 text-xs text-[var(--ink-low)]">
                            <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
                            <span>{blocker}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
