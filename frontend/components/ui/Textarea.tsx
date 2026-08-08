"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** The one textarea — surface-2 well, S4 focus grammar. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-3 text-[14px] text-[var(--ink-hi)] placeholder:text-[var(--ink-faint)] transition-colors duration-300",
                    "focus-visible:outline-none focus-visible:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
