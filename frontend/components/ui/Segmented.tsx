"use client";

import type { ComponentType } from "react";

export interface SegmentedItem {
    id: string;
    label: string;
    /** A mark, for switches whose options are places rather than states. */
    icon?: ComponentType<{ className?: string }>;
    /** A status colour, drawn as a dot — the same one the thing wears elsewhere. */
    dot?: string;
    count?: number;
    title?: string;
}

/**
 * One control, one setting at a time.
 *
 * Loose pills say "choose any"; a row of them housed in a single track says
 * "choose one", which is what both of the Library's bars actually mean. They
 * were drawn differently — the view switch as pills, the status filters as
 * other pills — and the filter row had no housing at all, so on a narrow
 * column its last chip was simply sliced off mid-word by the edge of a scroll
 * container nobody could see. The track gives that edge a reason to exist.
 */
export default function Segmented({
    items, value, onChange, ariaLabel, className = "",
}: {
    items: SegmentedItem[];
    value: string;
    onChange: (id: string) => void;
    ariaLabel: string;
    className?: string;
}) {
    return (
        <div
            className={`inline-flex max-w-full items-center gap-0.5 p-1 rounded-[10px] border overflow-x-auto scrollbar-none ${className}`}
            style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
            role="tablist"
            aria-label={ariaLabel}
        >
            {items.map(({ id, label, icon: Icon, dot, count, title }) => {
                const on = id === value;

                return (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={on}
                        title={title}
                        onClick={() => onChange(id)}
                        className={`shrink-0 inline-flex items-center gap-2 h-8 px-3.5 rounded-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                            on
                                ? "bg-[var(--accent)] text-white shadow-[0_2px_10px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                                : "text-white/40 hover:text-white hover:bg-white/[0.05]"
                        }`}
                    >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {dot && (
                            <span
                                aria-hidden
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: on ? "#fff" : dot }}
                            />
                        )}
                        {label}
                        {typeof count === "number" && (
                            <span className={`font-display text-[10px] font-black tabular-nums ${on ? "text-white/70" : "text-white/25"}`}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
