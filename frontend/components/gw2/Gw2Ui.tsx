import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The tool's three building blocks.
 *
 * Kept apart from the site's `Panel` on purpose. `Panel` is the profile's
 * instrument language — small uppercase headers, one accent — and it is right
 * there. Inside the tool a section is a sentence-size title and a line under
 * it, and a panel is a flat box with a hairline border.
 *
 * Flat on purpose, too. The first cut drew every header with a glowing ringed
 * icon and every panel with a wash in its domain's colour, and across a page of
 * them the decoration was all anyone saw (owner, 28 Oct 2026). Colour now
 * belongs to data — a bar, a status — and the words carry the structure.
 */

/**
 * A section of a page: a title, one line under it, and the way to the rest on
 * the right — "View all recommendations →".
 */
export function SectionHeader({
    title,
    description,
    action,
    meta,
}: {
    title: string;
    description?: string;
    action?: { href: string; label: string };
    /** Information rather than a link, e.g. "Weighing…". Ignored with `action`. */
    meta?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold leading-tight text-[var(--ink-hi)] md:text-xl">{title}</h2>
                {description && <p className="mt-1 max-w-[70ch] text-sm text-[var(--ink-low)]">{description}</p>}
            </div>

            {action ? (
                <Link
                    href={action.href}
                    className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)]"
                >
                    {action.label}
                    <ArrowRight size={13} aria-hidden />
                </Link>
            ) : (
                meta
            )}
        </div>
    );
}

/**
 * A boxed panel, mostly for the right-hand column: a title a reader can find
 * without squinting, and a line saying what the panel is drawn from.
 */
export function Gw2Panel({
    title,
    description,
    meta,
    className,
    children,
}: {
    title: string;
    description?: string;
    meta?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={cn("rounded-[var(--radius-panel)] border", className)}
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            <header className="flex items-start justify-between gap-3 border-b px-5 py-3.5" style={{ borderColor: "var(--line)" }}>
                <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold leading-snug text-[var(--ink-hi)]">{title}</h3>
                    {description && <p className="mt-0.5 text-xs text-[var(--ink-low)]">{description}</p>}
                </div>
                {meta}
            </header>
            <div className="px-5 py-4">{children}</div>
        </section>
    );
}

/**
 * The full-width button at the foot of a card or panel. One quiet style for all
 * of them: a row of cards each with a button in its own colour reads as a row
 * of buttons, and the site's accent stays for the one action a page is about.
 */
export function ActionLink({
    href,
    children,
    className,
}: {
    href: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--fill-1)] px-4 text-[13px] font-medium text-[var(--ink-hi)] transition-colors hover:bg-[var(--fill-3)]",
                className
            )}
        >
            {children}
            <ArrowRight size={14} aria-hidden className="text-[var(--ink-low)]" />
        </Link>
    );
}
