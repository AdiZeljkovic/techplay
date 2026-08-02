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

/** The console face is inline style — color-mix borders and layered radial
 *  gradients aren't expressible as static utility classes, and letting call
 *  sites paint it themselves is how the panel dialects fragmented last time. */
const CONSOLE_FACE: React.CSSProperties = {
    background: "linear-gradient(180deg, #131110 0%, #0c0a09 100%)",
    borderColor: "color-mix(in srgb, var(--accent) 22%, transparent)",
};

const CONSOLE_BLOOM: React.CSSProperties = {
    background:
        "radial-gradient(70% 130% at 0% 0%, color-mix(in srgb, var(--accent) 13%, transparent) 0%, transparent 60%), radial-gradient(70% 130% at 100% 100%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 60%)",
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
            {isConsole && (
                <>
                    <span aria-hidden className="absolute inset-0 pointer-events-none" style={CONSOLE_BLOOM} />
                    <span
                        aria-hidden
                        className="absolute right-3 top-3 w-5 h-5 pointer-events-none border-t border-r rounded-tr-[4px]"
                        style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)" }}
                    />
                </>
            )}
            {crown && (
                <span
                    aria-hidden
                    className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent"
                />
            )}
            {title && (
                <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                    <h3 className="flex items-center gap-2.5 font-display text-[12px] font-black uppercase tracking-[0.14em] text-white">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        {icon}
                        {title}
                    </h3>
                    {action && (
                        action.href ? (
                            <Link href={action.href} className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 hover:text-[var(--accent)] transition-colors duration-150">
                                {action.label} <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <button onClick={action.onClick} className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 hover:text-[var(--accent)] transition-colors duration-150">
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
