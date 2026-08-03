"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PanelProps {
    title?: string;
    icon?: ReactNode;
    action?: { label: string; href?: string; onClick?: () => void };
    /** Accent hairline crown (signature S2) — hero-tier surfaces only. */
    crown?: boolean;
    /**
     * `console` is the hero's instrument treatment: warm gradient face,
     * accent-tinted edge, corner blooms and a bracket. One per column at most
     * — repeated, it stops meaning anything.
     */
    variant?: "default" | "console";
    padding?: "md" | "none";
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
}

/**
 * The console face — flat, near-black, one shade warmer than the default
 * panel, with a faint accent edge. Flat on purpose: gradients and corner
 * blooms read as decoration; the approved tone is a matte instrument panel
 * where the content is the only thing that glows.
 */
const CONSOLE_FACE: React.CSSProperties = {
    background: "#12100f",
    borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
};

/**
 * The TechPlay panel — promoted from the profile dashboard's SectionCard.
 * Header carries the Tick (S1-md): Sora 12px uppercase + accent bar.
 */
export default function Panel({
    title,
    icon,
    action,
    crown = false,
    variant = "default",
    padding = "md",
    className = "",
    bodyClassName = "",
    children,
}: PanelProps) {
    const isConsole = variant === "console";

    return (
        <section
            className={cn(
                "relative rounded-[var(--radius-panel)] border overflow-hidden",
                isConsole ? "" : "bg-[var(--surface-1)] border-[var(--line)]",
                className
            )}
            style={isConsole ? CONSOLE_FACE : undefined}
        >
            {crown && (
                <span
                    aria-hidden
                    className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent"
                />
            )}
            {title && (
                <div className="relative flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                    {/* quiet header: the title labels the card, it doesn't compete
                        with the content — the accent belongs to the action */}
                    <h3 className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
                        <span className="w-1 h-3.5 rounded-full bg-[var(--accent)]" />
                        {icon}
                        {title}
                    </h3>
                    {action && (
                        action.href ? (
                            <Link href={action.href} className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] hover:brightness-125 transition-[filter] duration-150">
                                {action.label} <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <button onClick={action.onClick} className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] hover:brightness-125 transition-[filter] duration-150">
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
