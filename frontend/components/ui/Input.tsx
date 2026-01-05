"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                        {label}
                    </label>
                )}

                <input
                    id={inputId}
                    ref={ref}
                    className={cn(
                        "w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200",
                        "focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]",
                        error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-red-100",
                        className
                    )}
                    {...props}
                />

                {error && (
                    <p className="mt-1.5 text-sm text-[var(--danger)]">{error}</p>
                )}

                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-[var(--text-muted)]">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
