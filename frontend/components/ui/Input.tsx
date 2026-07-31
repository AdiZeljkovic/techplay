"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

/** The one text input — surface-2 well, S4 focus grammar. */
const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-[12px] font-bold uppercase tracking-wider text-[var(--ink-low)] mb-2"
                    >
                        {label}
                    </label>
                )}

                <input
                    id={inputId}
                    ref={ref}
                    className={cn(
                        "w-full h-11 px-4 bg-[var(--surface-2)] border border-[var(--line-strong)] rounded-[var(--radius-card)] text-[14px] text-[var(--ink-hi)] placeholder:text-[var(--ink-faint)] transition-colors duration-300",
                        "focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:ring-2 focus:ring-[var(--accent-soft)]",
                        error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[color-mix(in_srgb,var(--danger)_15%,transparent)]",
                        className
                    )}
                    {...props}
                />

                {error && (
                    <p className="mt-1.5 text-[12px] text-[var(--danger)]">{error}</p>
                )}

                {helperText && !error && (
                    <p className="mt-1.5 text-[12px] text-[var(--ink-low)]">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
