"use client";

import { AlertTriangle, Clock } from "lucide-react";
import Chip from "@/components/ui/Chip";
import GameIcon from "@/components/gw2/GameIcon";
import { domainTone } from "@/lib/gw2domain";
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
    const { title, body, confidence, effort, blockers, domain, details } = recommendation;

    /*
     * Three at most, and the count when there are more.
     *
     * An achievement can have eighteen steps left and a card is not a
     * checklist — the page it links to is. Three is enough to show the card is
     * telling the truth about what is left, which is the job here.
     */
    const steps = details?.steps_remaining ?? [];
    const shown = steps.filter((step) => step.text !== null).slice(0, 3);

    /*
     * The domain's colour, and the picture of whatever this card is about.
     *
     * Both are the difference between six cards that read as six kinds of
     * thing and six cards that read as a list. The tone is Guild Wars 2's,
     * not the site's, because a player already associates crimson with gear
     * and violet with fractals before reading either word.
     */
    const tone = domainTone(domain);
    const background = details?.background;

    return (
        <article
            className="relative flex h-full flex-col gap-3 overflow-hidden rounded-[var(--radius-card)] border p-4"
            style={{
                background: "var(--surface-2)",
                // The domain's own colour on the edge, brighter on a featured
                // card. One rail per card rather than one accent per board.
                borderColor: `color-mix(in srgb, ${tone} ${featured ? "38%" : "18%"}, var(--line-strong))`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,${featured ? "0.09" : "0.07"})`,
            }}
        >
            {/*
             * A mastery track's scene render, where there is one. Held well
             * back — it is atmosphere behind a sentence, and a card whose text
             * has to fight its own background is a worse card than a plain one.
             */}
            {background && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)]"
                    style={{
                        backgroundImage: `linear-gradient(to right, var(--surface-2) 38%, transparent), url(${background})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: 0.32,
                    }}
                />
            )}

            <div className="relative flex flex-wrap items-center gap-2">
                <Chip variant={CONFIDENCE_VARIANT[confidence]} size="sm">
                    {CONFIDENCE_LABEL[confidence]}
                </Chip>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: tone }}>
                    {domain}
                </span>
                {effort && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--ink-low)]">
                        <Clock size={11} aria-hidden />
                        {EFFORT_LABEL[effort] ?? effort}
                    </span>
                )}
            </div>

            <div className="relative flex items-start gap-3">
                <GameIcon src={details?.icon} alt="" size="lg" tone={tone} />
                <h3 className="font-display text-base leading-snug text-[var(--ink-hi)] text-balance">{title}</h3>
            </div>

            <p className="relative text-sm leading-relaxed text-[var(--ink-mid)]">{body}</p>

            {shown.length > 0 && (
                <div className="relative space-y-1.5">
                    <ul className="space-y-1">
                        {shown.map((step) => (
                            <li key={step.index} className="flex gap-2 text-xs text-[var(--ink-low)]">
                                <span
                                    aria-hidden
                                    className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                                    style={{ background: "var(--ink-faint)" }}
                                />
                                <span>{step.text}</span>
                            </li>
                        ))}
                    </ul>
                    {steps.length > shown.length && (
                        <p className="text-[11px] text-[var(--ink-faint)]">
                            and {steps.length - shown.length} more
                        </p>
                    )}
                </div>
            )}

            {blockers.length > 0 && (
                <ul className="relative mt-auto space-y-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
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
