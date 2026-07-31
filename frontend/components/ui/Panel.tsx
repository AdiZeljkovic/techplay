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
    padding?: "md" | "none";
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
}

/**
 * The TechPlay panel — promoted from the profile dashboard's SectionCard.
 * Header carries the Tick (S1-md): Sora 12px uppercase + accent bar.
 */
export default function Panel({
    title,
    icon,
    action,
    crown = false,
    padding = "md",
    className = "",
    bodyClassName = "",
    children,
}: PanelProps) {
    return (
        <section className={cn("relative rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] overflow-hidden", className)}>
            {crown && (
                <span
                    aria-hidden
                    className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent"
                />
            )}
            {title && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
                    <h3 className="flex items-center gap-2.5 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        {icon}
                        {title}
                    </h3>
                    {action && (
                        action.href ? (
                            <Link href={action.href} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150">
                                {action.label} <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <button onClick={action.onClick} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150">
                                {action.label} <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )
                    )}
                </div>
            )}
            <div className={cn(padding === "md" && "p-5", bodyClassName)}>{children}</div>
        </section>
    );
}
