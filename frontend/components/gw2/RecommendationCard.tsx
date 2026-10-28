"use client";

import { AlertTriangle, Check, Clock } from "lucide-react";
import Chip from "@/components/ui/Chip";
import Meter from "@/components/ui/Meter";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { ActionLink } from "@/components/gw2/Gw2Ui";
import { DOMAIN_ART, domainTone } from "@/lib/gw2domain";
import { CONFIDENCE_LABEL, EFFORT_LABEL, slotLabel, type Recommendation } from "@/lib/gw2";

/**
 * One recommendation: the scene when there is one, the subject's own icon, the
 * title, the reason, how far along it is, and a button to the page that
 * answers it. Flat, like the rest of the tool — the domain's colour is in the
 * bar, not in the card.
 *
 * Two things on this card are the product, not decoration.
 *
 * **The confidence chip.** The mockup writes "High priority" and "Ready now"
 * where a confidence belongs, and "Confidence to complete: High" beside a figure
 * nothing computes. The rule taken from that is that a claim carries its own
 * certainty or it is not drawn. `Confirmed` means the game's API states it
 * outright; `Worth a look` means the advice is phrased as a question because we
 * are not sure. Those are different promises and they look different.
 *
 * **The blockers.** A recommendation the player cannot act on yet is the more
 * useful of the two — "infusions only socket into ascended gear" is the sentence
 * that saves an evening. So a blocked card is drawn, drawn plainly, and simply
 * ranks below something they can go and do now.
 *
 * The bar and the button are there only when the backend sends them. A bar
 * needs something to count towards and a button needs a page that exists; a
 * card without either is a card about something with neither.
 */

const CONFIDENCE_VARIANT: Record<Recommendation["confidence"], "success" | "accent" | "neutral" | "warning"> = {
    confirmed: "success",
    high: "accent",
    medium: "neutral",
    needs_confirmation: "warning",
};

/** A worn piece, for the row of slots on a gear card. */
export interface WornPiece {
    slot: string;
    icon: string | null;
    rarity: string;
    done: boolean;
}

export default function RecommendationCard({
    recommendation,
    featured = false,
    pieces,
}: {
    recommendation: Recommendation;
    featured?: boolean;
    /** The core slots, drawn under a gear card the way the mockup draws its armour row. */
    pieces?: WornPiece[];
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
     * The bar's colour is Guild Wars 2's, not the site's: a player already
     * associates crimson with gear and violet with fractals before reading
     * either word. The scene is our art for the domain once it exists, else the
     * mastery track's own render where the card is about one, else nothing.
     */
    const tone = domainTone(domain);
    const scene = DOMAIN_ART[domain] ?? details?.background;

    const progress = details?.progress;
    const percent =
        progress && progress.target > 0 ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : null;

    const chips = (
        <div className="flex items-start justify-between gap-2">
            <Chip variant={CONFIDENCE_VARIANT[confidence]} size="sm">
                {CONFIDENCE_LABEL[confidence]}
            </Chip>
            {effort && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-0)]/80 px-2 py-0.5 text-[11px] text-[var(--ink-mid)]">
                    <Clock size={11} aria-hidden />
                    {EFFORT_LABEL[effort] ?? effort}
                </span>
            )}
        </div>
    );

    return (
        <article
            className="flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] border"
            style={{
                background: "var(--surface-1)",
                borderColor: featured ? "var(--ink-faint)" : "var(--line-strong)",
            }}
        >
            {scene && (
                <div className="relative h-28 shrink-0 border-b" style={{ borderColor: "var(--line)" }}>
                    <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{ backgroundImage: `url(${scene})`, backgroundSize: "cover", backgroundPosition: "center" }}
                    />
                    <div className="relative p-3">{chips}</div>
                </div>
            )}

            <div className="flex flex-1 flex-col gap-3 p-4">
                {!scene && chips}

                <div className="flex items-start gap-3">
                    {details?.icon && <GameIcon src={details.icon} alt="" size="lg" />}
                    <div className="min-w-0 flex-1">
                        <span className="text-xs capitalize text-[var(--ink-low)]">{domain}</span>
                        <div className="mt-0.5 flex items-start gap-2">
                            <h3 className="font-display text-lg font-semibold leading-snug text-[var(--ink-hi)] text-balance">
                                {title}
                            </h3>
                            <WikiLink wiki={details?.wiki} name={title} compact className="ml-auto mt-1.5" />
                        </div>
                    </div>
                </div>

                <p className="text-sm leading-relaxed text-[var(--ink-mid)]">{body}</p>

                {shown.length > 0 && (
                    <div className="space-y-1.5">
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
                            <p className="text-[11px] text-[var(--ink-faint)]">and {steps.length - shown.length} more</p>
                        )}
                    </div>
                )}

                {progress && percent !== null && (
                    <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="text-[var(--ink-mid)]">{percent}% complete</span>
                            <span className="font-numeric text-[var(--ink-low)]">
                                {progress.current} / {progress.target}
                                {progress.unit ? ` ${progress.unit}` : ""}
                            </span>
                        </div>
                        <Meter value={progress.current} max={progress.target} size="sm" tone={tone} />
                    </div>
                )}

                {pieces && pieces.length > 0 && (
                    <ul className="grid grid-cols-6 gap-1.5" aria-label="Core slots">
                        {pieces.map((piece) => (
                            <li
                                key={piece.slot}
                                className="relative h-7 w-7"
                                title={`${slotLabel(piece.slot)} — ${piece.done ? piece.rarity : `${piece.rarity}, not yet ascended`}`}
                            >
                                {piece.icon ? (
                                    <GameIcon src={piece.icon} alt="" size="sm" rarity={piece.rarity} dim={piece.done} />
                                ) : (
                                    <span
                                        aria-hidden
                                        className="block h-6 w-6 rounded-[4px] border border-dashed"
                                        style={{ borderColor: "var(--line-strong)" }}
                                    />
                                )}
                                {piece.done && (
                                    <Check
                                        size={11}
                                        strokeWidth={3}
                                        aria-hidden
                                        className="absolute bottom-0 right-0 rounded-full bg-[var(--surface-1)] p-[1px] text-[var(--success)]"
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {blockers.length > 0 && (
                    <ul className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        {blockers.map((blocker) => (
                            <li key={blocker} className="flex gap-2 text-xs text-[var(--ink-low)]">
                                <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
                                <span>{blocker}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {details?.action && (
                    <div className="mt-auto pt-1">
                        <ActionLink href={details.action.href}>
                            {details.action.label}
                        </ActionLink>
                    </div>
                )}
            </div>
        </article>
    );
}
