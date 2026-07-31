"use client";

import Link from "next/link";
import { Bell, CalendarDays } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";

/**
 * A zero is not news. When a counter has nothing to report it becomes the
 * invitation that would make it non-zero.
 */
function HighlightChip({
    icon,
    value,
    label,
    emptyLabel,
    href,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    emptyLabel: string;
    href: string;
}) {
    const empty = value === 0;

    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--fill-1)] px-4 py-3 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
        >
            <span className={`shrink-0 ${empty ? "text-[var(--ink-faint)]" : "text-[var(--accent)]"} group-hover:text-[var(--accent)] transition-colors duration-300`}>
                {icon}
            </span>
            {empty ? (
                <span className="min-w-0 text-[11px] text-[var(--ink-low)] leading-tight group-hover:text-[var(--ink-mid)] transition-colors duration-300">
                    {emptyLabel}
                </span>
            ) : (
                <span className="min-w-0 flex items-baseline gap-2">
                    <span className="font-display text-[17px] font-bold text-[var(--ink-hi)] leading-none tabular-nums">{value}</span>
                    <span className="text-[11px] text-[var(--ink-low)] leading-tight">{label}</span>
                </span>
            )}
        </Link>
    );
}

/** The two "what's new for you" pulses, under the hero. */
export default function HighlightStrip({ highlights }: { highlights: DashboardData["highlights"] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HighlightChip
                icon={<Bell className="w-5 h-5" />}
                value={highlights.updates_from_followed}
                label="new updates from games you follow"
                emptyLabel="Follow games to get their updates here"
                href="/games"
            />
            <HighlightChip
                icon={<CalendarDays className="w-5 h-5" />}
                value={highlights.releases_this_week}
                label={highlights.releases_this_week === 1 ? "tracked release this week" : "tracked releases this week"}
                emptyLabel="Nothing lands this week — see what's coming"
                href="/calendar"
            />
        </div>
    );
}
