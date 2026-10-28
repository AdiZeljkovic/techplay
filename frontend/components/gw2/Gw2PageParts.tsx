import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pieces the account pages share, beside the three in `Gw2Ui`: the summary
 * panel across the top of a page, the figures inside it, and a plain card.
 *
 * The ascended set page drew all three first, inline. They live here because
 * Story, Raids and Account draw them the same way, and four copies of one
 * panel drift apart the first time somebody adjusts one of them. Flat, like
 * the rest of the tool — see `Gw2Ui` for why.
 */

/** The panel across the top of a page: a sentence that says where the reader stands, and the figures behind it. */
export function PageSummary({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <section
            className="space-y-5 rounded-[var(--radius-panel)] border p-5 md:p-6"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold leading-tight text-[var(--ink-hi)] md:text-2xl">{title}</h2>
                {description && <p className="mt-1.5 max-w-[75ch] text-sm leading-relaxed text-[var(--ink-mid)]">{description}</p>}
            </div>

            {children}
        </section>
    );
}

/**
 * One figure in a summary, with what it counts written under it. A row of these
 * in a `<dl>` reads as a strip of figures, each set off by a rule on its left.
 */
export function SummaryFact({ value, label }: { value: string; label: string }) {
    return (
        <div className="min-w-0 border-l pl-4" style={{ borderColor: "var(--line-strong)" }}>
            <dt className="sr-only">{label}</dt>
            <dd className="font-numeric text-xl font-semibold leading-tight text-[var(--ink-hi)]">{value}</dd>
            <dd className="mt-0.5 text-xs text-[var(--ink-low)]">{label}</dd>
        </div>
    );
}

/** A card for one thing in a row of them — a raid wing, a story season, a product. */
export function Gw2Card({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div
            className={cn("rounded-[var(--radius-panel)] border p-4", className)}
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            {children}
        </div>
    );
}
