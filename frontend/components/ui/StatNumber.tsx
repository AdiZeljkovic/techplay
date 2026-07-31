import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatNumberProps {
    value: ReactNode;
    label?: string;
    size?: "sm" | "md" | "lg";
    suffix?: ReactNode;
    className?: string;
}

const SIZES: Record<string, string> = {
    sm: "text-[15px]",
    md: "text-[22px]",
    lg: "text-[28px]",
};

/**
 * Command Numerals (signature S3): every stat on the platform renders in
 * Sora tabular figures. Inter digits in stats are a design violation.
 */
export default function StatNumber({ value, label, size = "md", suffix, className }: StatNumberProps) {
    return (
        <div className={cn("min-w-0", className)}>
            <p className={cn("font-display font-bold tabular-nums text-[var(--ink-hi)] leading-none", SIZES[size])}>
                {value}
                {suffix && <span className="text-[0.6em] text-[var(--ink-low)] ml-0.5">{suffix}</span>}
            </p>
            {label && (
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] leading-tight">{label}</p>
            )}
        </div>
    );
}
