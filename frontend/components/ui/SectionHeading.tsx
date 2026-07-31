"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeadingProps {
    title: string;
    /** lg = page sections (15px), md = sub-sections (12px). Nothing else exists. */
    size?: "lg" | "md";
    icon?: ReactNode;
    kicker?: string;
    action?: { label: string; href: string };
    className?: string;
}

/**
 * THE section header (signature S1): accent Tick + Sora uppercase.
 * Replaces every hand-rolled heading variant across the product.
 */
export default function SectionHeading({ title, size = "lg", icon, kicker, action, className }: SectionHeadingProps) {
    return (
        <div className={cn("flex items-center justify-between mb-5", className)}>
            <div className="min-w-0">
                {kicker && (
                    <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">{kicker}</p>
                )}
                <h2
                    className={cn(
                        "flex items-center gap-2.5 font-display font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]",
                        size === "lg" ? "text-[15px]" : "text-[12px]"
                    )}
                >
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)] shrink-0" />
                    {icon && <span className="text-[var(--accent)] shrink-0">{icon}</span>}
                    <span className="truncate">{title}</span>
                </h2>
            </div>
            {action && (
                <Link
                    href={action.href}
                    className="flex items-center gap-1 shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150"
                >
                    {action.label} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            )}
        </div>
    );
}
