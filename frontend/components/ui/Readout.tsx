"use client";

import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import type { ReactNode } from "react";

interface ReadoutProps {
    /** The kicker above the number. Two or three words at most. */
    label: string;
    value: number | string;
    /** A short suffix — XP, B, h, %. Sits on the baseline, quieter than the value. */
    unit?: string;
    /** A glyph before the label, for a row of readouts that need telling apart. */
    icon?: ReactNode;
    /** Movement since last period, if there is a meaningful one. */
    delta?: number | null;
    size?: "sm" | "md" | "lg";
    /** Tints the value. Use for state — a lit streak, a rank colour. */
    tone?: string;
    /** Numbers climb to their value on first paint. Off for anything live. */
    animate?: boolean;
    className?: string;
}

const SIZES = {
    sm: "text-[19px]",
    md: "text-[26px]",
    lg: "text-[34px] sm:text-[40px]",
} as const;

/**
 * A number, presented as an instrument reads one.
 *
 * The profile's figures were styled as running text with a small icon beside
 * them — "BOUNTY 2,451" looked like a sentence about a wallet rather than a
 * gauge showing one. A readout is three parts in a fixed relationship: a small
 * kicker naming the quantity, the value in tabular figures at a size you can
 * read across a room, and a unit that stays out of the way.
 *
 * Tabular figures matter more than they sound: a column of readouts whose
 * digits are different widths never quite lines up, and the eye reads that
 * misalignment as sloppiness long before it works out why.
 */
export default function Readout({
    label, value, unit, icon, delta, size = "md", tone, animate = false, className = "",
}: ReadoutProps) {
    const numeric = typeof value === "number" ? value : null;
    const climbed = useCountUp(numeric ?? 0, 900);
    const shown = numeric === null ? value : (animate ? climbed : numeric).toLocaleString("en-US");

    return (
        <div className={cn("min-w-0", className)}>
            <p className="flex items-center gap-1.5 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                {icon}
                <span className="truncate">{label}</span>
            </p>

            <p className="mt-1 flex items-baseline gap-1.5">
                <span
                    className={cn("font-display font-black tabular-nums leading-none text-white", SIZES[size])}
                    style={tone ? { color: tone } : undefined}
                >
                    {shown}
                </span>

                {unit && (
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{unit}</span>
                )}

                {/* Zero is not movement, and rendering it as "0%" makes a
                    stationary number look like it did something. */}
                {typeof delta === "number" && delta !== 0 && (
                    <span
                        className={cn(
                            "font-display text-[10px] font-black tabular-nums",
                            delta > 0 ? "text-emerald-400" : "text-red-400",
                        )}
                    >
                        {delta > 0 ? "+" : ""}{delta}%
                    </span>
                )}
            </p>
        </div>
    );
}
