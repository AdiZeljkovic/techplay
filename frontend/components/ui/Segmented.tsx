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
    items, value, onChange, ariaLabel, className = "", wrap = false,
}: {
    items: SegmentedItem[];
    value: string;
    onChange: (id: string) => void;
    ariaLabel: string;
    className?: string;
    /**
     * Let the row run onto a second line instead of scrolling.
     *
     * The track scrolls by default, with `scrollbar-none` — which is right for
     * three or four options in a fixed corner, and wrong for the shelf filters,
     * where seven chips share a row with two buttons and the last of them was
     * simply gone. A hidden scrollbar means an option nobody can see and nothing
     * saying there is more: Dropped existed and could not be reached.
     *
     * Wrapping costs a second line at some widths and shows every option at all
     * of them, which is the trade a filter row wants and a view switch does not.
     */
    wrap?: boolean;
}) {
    return (
        <div
            className={`${wrap ? "flex flex-wrap" : "inline-flex overflow-x-auto scrollbar-none"} max-w-full items-center gap-1 p-1 rounded-[10px] border ${className}`}
            style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
            role="tablist"
            aria-label={ariaLabel}
        >
            {items.map(({ id, label, icon: Icon, dot, count, title }) => {
                const on = id === value;
                // An option holding nothing is still worth offering — it is how
                // you find out the shelf has no dropped games — but it should
                // not compete with the ones that do.
                const empty = count === 0 && !on;

                return (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={on}
                        title={title}
                        onClick={() => onChange(id)}
                        // Tighter than the site's other uppercase runs on
                        // purpose: nine of these share a line, and 0.12em of
                        // tracking across nine words is most of a tenth chip.
                        className={`shrink-0 inline-flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.09em] transition-colors duration-300 ${
                            on
                                ? "bg-[var(--accent)] text-white shadow-[0_2px_10px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                                : empty
                                    ? "text-white/30 hover:text-white/70 hover:bg-white/[0.05]"
                                    : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                        }`}
                    >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {dot && (
                            <span
                                aria-hidden
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${empty ? "opacity-40" : ""}`}
                                style={{ background: on ? "#fff" : dot }}
                            />
                        )}
                        {label}
                        {/* The count in its own plate rather than loose beside
                            the word: at the same weight and tracking as the
                            label it read as part of the name — "PLAYED 182"
                            looked like one long word. */}
                        {typeof count === "number" && (
                            <span
                                className={`min-w-[20px] h-[18px] px-1.5 rounded-[5px] grid place-items-center font-display text-[10px] font-black tabular-nums tracking-normal ${
                                    on ? "bg-white/25 text-white" : empty ? "bg-white/[0.04] text-white/30" : "bg-white/[0.07] text-white/70"
                                }`}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
