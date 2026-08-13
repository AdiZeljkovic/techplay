"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * What a panel is made of.
 *
 * There are four surface tokens and, before this, one of them did 241 jobs —
 * every card on the profile was the same flat sheet with the same header, so
 * nothing was first and the eye had nowhere to land. Three materials, one
 * lighting model:
 *
 *   matte       the base sheet. Lists, feeds, anything secondary.
 *   instrument  raised: a rung up the surface ladder with light on its top
 *               edge. Anything that reports a number or a state.
 *   lit         instrument plus an accent bloom and a coloured edge. At most
 *               one per column — it is the thing the eye should find first,
 *               and two of them is none.
 *
 * The light comes from above and only from above. Raised faces catch it on
 * their top edge; flat ones do not. That single inset highlight is what turns
 * a div into a panel.
 */
export type PanelMaterial = "matte" | "instrument" | "lit";

interface PanelProps {
    title?: string;
    action?: { label: string; href?: string; onClick?: () => void };
    /** Right-side header content that is information, not a link — e.g. a
     *  countdown. Ignored when `action` is present. */
    meta?: ReactNode;
    /** Accent hairline crown (signature S2) — hero-tier surfaces only. */
    crown?: boolean;
    material?: PanelMaterial;
    /**
     * @deprecated `variant="console"` is the old name for `material="instrument"`.
     * Kept so the twelve existing callers keep working while they migrate.
     */
    variant?: "default" | "console";
    padding?: "md" | "none";
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
}

const FACE: Record<PanelMaterial, React.CSSProperties> = {
    matte: {
        background: "var(--surface-1)",
        borderColor: "var(--line)",
    },
    instrument: {
        background: "var(--surface-2)",
        borderColor: "var(--line-strong)",
        // The light. One rule, one direction, everywhere.
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
    },
    lit: {
        background: "var(--surface-2)",
        borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09)",
    },
};

export default function Panel({
    title,
    action,
    meta,
    crown = false,
    material,
    variant = "default",
    padding = "md",
    className = "",
    bodyClassName = "",
    children,
}: PanelProps) {
    // The old prop still decides when the new one is absent, so nothing had to
    // change on the day this landed.
    const face: PanelMaterial = material ?? (variant === "console" ? "instrument" : "matte");

    return (
        <section
            className={cn("relative rounded-[var(--radius-panel)] border overflow-hidden", className)}
            style={FACE[face]}
        >
            {/* The bloom that makes `lit` the thing you look at. Behind the
                content and out of the way of clicks. */}
            {face === "lit" && (
                <span
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(72% 120% at 12% 0%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 62%)" }}
                />
            )}

            {crown && (
                <span
                    aria-hidden
                    className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent"
                />
            )}

            {title && (
                <div
                    className={cn(
                        "relative flex items-center justify-between gap-4 px-5 py-3.5",
                        face === "matte" ? "border-b border-white/[0.05]" : "border-b border-white/[0.07]",
                    )}
                >
                    <h3
                        className={cn(
                            "flex items-center gap-2.5 shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.15em]",
                            face === "lit" ? "text-[var(--accent-ink)]" : "text-white/55",
                        )}
                    >
                        {/* The tick belongs to `lit` alone. It used to sit on
                            every header, twenty times a screen, which is how an
                            accent stops being an accent. */}
                        {face === "lit" && <span className="w-1 h-3.5 rounded-full bg-[var(--accent)]" />}
                        {title}
                    </h3>

                    {/* An instrument's header carries a rule out to its action —
                        it aligns the eye across a row of readouts. */}
                    {face === "instrument" && <span aria-hidden className="flex-1 h-px bg-white/[0.06]" />}

                    {!action && meta}
                    {action && (
                        action.href ? (
                            <Link href={action.href} className="flex items-center gap-1 shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-ink)] hover:brightness-125 transition-[filter] duration-150">
                                {action.label} <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <button onClick={action.onClick} className="flex items-center gap-1 shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-ink)] hover:brightness-125 transition-[filter] duration-150">
                                {action.label} <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )
                    )}
                </div>
            )}

            <div className={cn("relative", padding === "md" && "p-5", bodyClassName)}>{children}</div>
        </section>
    );
}
