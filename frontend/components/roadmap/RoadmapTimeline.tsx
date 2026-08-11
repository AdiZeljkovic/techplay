import { Calendar } from "lucide-react";
import { QUARTERS } from "@/lib/roadmapData";

/**
 * The year at a glance, above the detail.
 *
 * Was a zig-zag: each quarter slid in from alternating sides, sat on a
 * gradient spine whose height animated on scroll, and carried a glowing node.
 * It read as motion rather than as a schedule. This is the same four quarters
 * as a straight rail — one row, current quarter marked.
 */

// Q1 is the quarter in progress. Derived from the calendar so it stops lying
// in April; the old component hardcoded 0 with a "for demo" comment.
const CURRENT = Math.floor(new Date().getMonth() / 3);

export default function RoadmapTimeline() {
    return (
        <section className="container-page">
            <div className="tp-fade-up tp-d3">
                <h2 className="flex items-center gap-2.5 mb-5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                    The 2026 journey
                </h2>

                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUARTERS.map((quarter, index) => {
                        const isCurrent = index === CURRENT;
                        const isDone = index < CURRENT;

                        return (
                            <li
                                key={quarter.id}
                                className={`rounded-[var(--radius-card)] border p-5 ${
                                    isCurrent
                                        ? "bg-[var(--surface-2)] border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                        : "bg-[var(--surface-1)] border-[var(--line)]"
                                }`}
                            >
                                <div className="flex items-center gap-2.5 mb-2">
                                    <span
                                        aria-hidden
                                        className={`w-2 h-2 rounded-full ${
                                            isCurrent ? "bg-[var(--accent)]" : isDone ? "bg-[var(--ink-low)]" : "bg-[var(--line-strong)]"
                                        }`}
                                    />
                                    <span className={`font-display text-[14px] font-bold uppercase tracking-wider ${isCurrent ? "text-[var(--accent)]" : "text-[var(--ink-hi)]"}`}>
                                        {quarter.label}
                                    </span>
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{quarter.months}</p>
                                <p className="mt-2 text-[13px] text-[var(--ink-low)] leading-snug">{quarter.description}</p>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
