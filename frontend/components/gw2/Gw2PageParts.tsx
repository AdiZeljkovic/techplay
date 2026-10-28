import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pieces the account pages share in the redesign, beside the three in
 * `Gw2Ui`: the summary panel across the top of a page, the facts inside it,
 * and a card tinted in the colour of what it holds.
 *
 * The ascended set page drew all three first, inline. They live here because
 * Story, Raids and Account draw them the same way, and four copies of one
 * gradient drift apart the first time somebody adjusts one of them.
 */

/**
 * The panel across the top of a page: a ringed icon in the page's colour, a
 * sentence that says where the reader stands, and whatever figures back it.
 */
export function PageSummary({
    icon,
    tone,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    tone: string;
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-5 md:p-6"
            style={{ background: "var(--surface-1)", borderColor: `color-mix(in srgb, ${tone} 40%, var(--line-strong))` }}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(60% 90% at 0% 0%, color-mix(in srgb, ${tone} 16%, transparent), transparent 70%)` }}
            />

            <div className="relative space-y-5">
                <div className="flex items-start gap-4">
                    <span
                        aria-hidden
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
                        style={{
                            color: tone,
                            borderColor: `color-mix(in srgb, ${tone} 70%, transparent)`,
                            boxShadow: `0 0 24px color-mix(in srgb, ${tone} 30%, transparent)`,
                        }}
                    >
                        {icon}
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-display text-xl font-bold leading-tight text-[var(--ink-hi)] md:text-2xl">{title}</h2>
                        {description && <p className="mt-1 text-sm text-[var(--ink-mid)]">{description}</p>}
                    </div>
                </div>

                {children}
            </div>
        </section>
    );
}

/** One figure in a summary, with what it counts written under it. */
export function SummaryFact({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
    return (
        <div className="flex items-start gap-3">
            <span
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-card)]"
                style={{ background: "var(--fill-1)", color: "var(--ink-mid)" }}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-lg font-bold leading-tight text-[var(--ink-hi)]">{value}</dd>
                <dd className="text-xs text-[var(--ink-low)]">{label}</dd>
            </div>
        </div>
    );
}

/**
 * A card in the colour of what it holds — a raid wing, a story season, a
 * product. The glow rises from the foot, as on the ascended pieces, so a row
 * of these reads as a row of things rather than a row of boxes.
 */
export function ToneCard({
    tone,
    className,
    children,
}: {
    tone: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn("rounded-[var(--radius-panel)] border p-4", className)}
            style={{
                background: "var(--surface-1)",
                borderColor: `color-mix(in srgb, ${tone} 38%, var(--line))`,
                boxShadow: `inset 0 -40px 60px -40px color-mix(in srgb, ${tone} 18%, transparent)`,
            }}
        >
            {children}
        </div>
    );
}
