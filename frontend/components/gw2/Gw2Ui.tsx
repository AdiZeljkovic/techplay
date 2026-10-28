import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The redesign's three building blocks, drawn the way the mockups draw them.
 *
 * Kept apart from the site's `Panel` on purpose. `Panel` is the profile's
 * instrument language — small uppercase headers, one accent — and it is right
 * there. The mockups ask for something else inside the tool: a section headed by
 * a ringed icon and a sentence-size title, panels whose colour says what they
 * are about, and buttons in the colour of the thing they open.
 */

/**
 * A section of a page: ringed icon, title, one line under it, and the way to
 * the rest on the right — "View all recommendations →".
 */
export function SectionHeader({
    icon,
    title,
    description,
    action,
    meta,
    tone = "var(--accent)",
}: {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: { href: string; label: string };
    /** Information rather than a link, e.g. "Weighing…". Ignored with `action`. */
    meta?: ReactNode;
    tone?: string;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="flex min-w-0 items-start gap-3.5">
                <span
                    aria-hidden
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2"
                    style={{
                        borderColor: `color-mix(in srgb, ${tone} 70%, transparent)`,
                        color: tone,
                        boxShadow: `0 0 18px color-mix(in srgb, ${tone} 22%, transparent)`,
                    }}
                >
                    {icon}
                </span>
                <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold leading-tight text-[var(--ink-hi)] md:text-2xl">
                        {title}
                    </h2>
                    {description && <p className="mt-1 text-sm text-[var(--ink-low)]">{description}</p>}
                </div>
            </div>

            {action ? (
                <Link
                    href={action.href}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-soft)]"
                    style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)" }}
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
 * A boxed panel, mostly for the right-hand column: an icon in the panel's own
 * colour, a title a reader can find without squinting, and a line saying what
 * the panel is drawn from.
 */
export function Gw2Panel({
    icon,
    title,
    description,
    tone = "var(--accent)",
    meta,
    className,
    children,
}: {
    icon: ReactNode;
    title: string;
    description?: string;
    tone?: string;
    meta?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={cn("relative overflow-hidden rounded-[var(--radius-panel)] border", className)}
            style={{
                background: "var(--surface-1)",
                borderColor: `color-mix(in srgb, ${tone} 16%, var(--line-strong))`,
            }}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(70% 60% at 0% 0%, color-mix(in srgb, ${tone} 9%, transparent), transparent 70%)` }}
            />
            <header className="relative flex items-start justify-between gap-3 px-5 pb-3 pt-4">
                <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden className="mt-0.5 shrink-0" style={{ color: tone }}>
                        {icon}
                    </span>
                    <div className="min-w-0">
                        <h3 className="font-display text-[17px] font-bold leading-snug text-[var(--ink-hi)]">{title}</h3>
                        {description && <p className="mt-0.5 text-xs text-[var(--ink-low)]">{description}</p>}
                    </div>
                </div>
                {meta}
            </header>
            <div className="relative px-5 pb-5">{children}</div>
        </section>
    );
}

/**
 * The full-width button at the foot of a card or panel, in the colour of what
 * it opens. Rounded rather than the site's notched command cut: the mockups
 * draw a row of these, one per card, and a row of the loudest thing the site
 * has stops being loud.
 */
export function ActionLink({
    href,
    children,
    tone = "var(--accent)",
    className,
}: {
    href: string;
    children: ReactNode;
    tone?: string;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border px-4 text-[13px] font-medium text-[var(--ink-hi)] transition-[filter,background-color] hover:brightness-125",
                className
            )}
            style={{
                background: `color-mix(in srgb, ${tone} 26%, var(--surface-2))`,
                borderColor: `color-mix(in srgb, ${tone} 55%, transparent)`,
            }}
        >
            {children}
            <ArrowRight size={14} aria-hidden />
        </Link>
    );
}
