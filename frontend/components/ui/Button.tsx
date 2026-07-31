"use client";

import { cn } from "@/lib/utils";
import {
    forwardRef,
    ReactNode,
    ButtonHTMLAttributes,
    cloneElement,
    isValidElement,
    Children,
} from "react";

/**
 * The Command Button — TechPlay's one button (signature move S4).
 * Sora uppercase, rounded-card, ease-hud transitions. The accent glow lives
 * on `primary` only; nothing else on a page may glow (except the XP ring).
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** `outline` is a deprecated alias for `secondary` (legacy imports). */
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    /** Renders the child element (e.g. a <Link>) with button styling instead of a <button>. */
    asChild?: boolean;
    icon?: ReactNode;
    children?: ReactNode;
}

const BASE =
    "inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider " +
    "rounded-[var(--radius-card)] transition-colors duration-300 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)] " +
    "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

const VARIANTS: Record<string, string> = {
    primary:
        "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[var(--glow-accent)]",
    secondary:
        "bg-[var(--fill-2)] text-[var(--ink-hi)] border border-[var(--line-strong)] hover:bg-[var(--fill-3)]",
    outline:
        "bg-[var(--fill-2)] text-[var(--ink-hi)] border border-[var(--line-strong)] hover:bg-[var(--fill-3)]",
    ghost:
        "bg-transparent text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)]",
    danger:
        "bg-[var(--danger)] text-white hover:bg-[color-mix(in_srgb,var(--danger)_85%,black)]",
};

const SIZES: Record<string, string> = {
    sm: "h-9 px-4 text-[11px]",
    md: "h-11 px-5 text-[12px]",
    lg: "h-12 px-6 text-[13px]",
};

const Spinner = () => (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, asChild, icon, children, disabled, ...props }, ref) => {
        const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

        // Minimal Slot: style the child (typically a Link) instead of nesting
        // interactive elements — fixes the button-inside-link double-chrome bug.
        if (asChild && isValidElement(children)) {
            const child = Children.only(children) as React.ReactElement<{ className?: string; children?: ReactNode }>;
            return cloneElement(child, {
                className: cn(classes, child.props.className),
                children: (
                    <>
                        {icon}
                        {child.props.children}
                    </>
                ),
            });
        }

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? <Spinner /> : icon}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
