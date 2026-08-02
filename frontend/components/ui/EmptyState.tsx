"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
    variant?: "full" | "compact" | "hint";
    icon?: ReactNode;
    title: string;
    body?: string;
    action?: { label: string; href: string; icon?: ReactNode };
    className?: string;
}

/**
 * The one empty state. `full` for panel bodies, `compact` for tight slots,
 * `hint` for inline whispers. An empty account must read as an invitation,
 * never as a broken page.
 */
export default function EmptyState({ variant = "full", icon, title, body, action, className }: EmptyStateProps) {
    if (variant === "hint") {
        return (
            <p className={cn("flex-1 flex items-center justify-center text-center text-[12px] text-white/35 py-4 px-2", className)}>
                {title}
            </p>
        );
    }

    return (
        <div
            className={cn(
                "flex-1 flex flex-col items-center justify-center gap-2.5 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] bg-[var(--fill-1)] text-center",
                variant === "full" ? "min-h-[180px] p-6" : "min-h-[104px] px-4 py-5",
                className
            )}
        >
            {icon && variant === "full" && (
                <span className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                    {icon}
                </span>
            )}
            <p className={cn("font-display font-bold text-white", variant === "full" ? "text-[13px]" : "text-[12px]")}>{title}</p>
            {body && <p className="text-[11px] text-white/35 max-w-[260px] -mt-1">{body}</p>}
            {action && (
                <Link
                    href={action.href}
                    className="mt-1 inline-flex items-center gap-1.5 px-4 h-9 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300"
                >
                    {action.icon}
                    {action.label}
                </Link>
            )}
        </div>
    );
}
