import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChipProps {
    variant?: "accent" | "neutral" | "success" | "warning" | "danger" | "kicker";
    size?: "sm" | "md";
    icon?: ReactNode;
    className?: string;
    children: ReactNode;
}

const VARIANTS: Record<string, string> = {
    accent: "bg-[var(--accent-soft)] text-[var(--accent-bright)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]",
    neutral: "bg-[var(--fill-2)] text-[var(--ink-low)] border border-[var(--line)]",
    success: "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)] border border-[color-mix(in_srgb,var(--success)_25%,transparent)]",
    warning: "bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)] border border-[color-mix(in_srgb,var(--warning)_25%,transparent)]",
    danger: "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)] border border-[color-mix(in_srgb,var(--danger)_25%,transparent)]",
    /** Text-only eyebrow (no pill chrome) */
    kicker: "text-[var(--accent)] px-0",
};

/** The one pill/badge/eyebrow. */
export default function Chip({ variant = "neutral", size = "sm", icon, className, children }: ChipProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap",
                size === "sm" ? "h-5 px-2.5 text-[10px]" : "h-6 px-3 text-[11px]",
                variant === "kicker" && "h-auto rounded-none",
                VARIANTS[variant],
                className
            )}
        >
            {icon}
            {children}
        </span>
    );
}
