"use client";

import Link from "next/link";
import { Bell, CalendarDays, ArrowRight } from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";
import { useCountUp } from "@/hooks/useCountUp";

/**
 * A signal card. With something to report it leads with the number and
 * lights up; with nothing to report it becomes the invitation that would
 * make it non-zero — never a greyed-out field.
 */
function SignalCard({
    icon: Icon,
    kicker,
    value,
    unit,
    emptyTitle,
    emptyBody,
    href,
}: {
    icon: React.ComponentType<{ className?: string }>;
    kicker: string;
    value: number;
    unit: string;
    emptyTitle: string;
    emptyBody: string;
    href: string;
}) {
    const animated = useCountUp(value, 900);
    const live = value > 0;

    return (
        <Link
            href={href}
            className="group relative flex items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] p-4 overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-300"
        >
            {/* HUD field + a bloom that only lights when there's news */}
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-40 pointer-events-none" />
            {live && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute -left-10 -top-16 w-[260px] h-[260px] rounded-full opacity-[0.14]"
                    style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
                />
            )}
            {/* accent rail draws across the top on hover */}
            <span
                aria-hidden
                className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
            />

            {/* icon plate */}
            <span
                className={`relative shrink-0 w-12 h-12 rounded-[var(--radius-card)] flex items-center justify-center transition-all duration-300 ${
                    live
                        ? "bg-[var(--accent)] text-white shadow-[var(--glow-accent)]"
                        : "bg-[var(--fill-2)] border border-[var(--line)] text-[var(--ink-faint)] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-transparent"
                }`}
            >
                <Icon className="w-5 h-5" />
                {live && (
                    <span aria-hidden className="absolute -top-1 -right-1 w-3 h-3">
                        <span className="tp-pulse-ring absolute inset-0 rounded-full bg-[var(--accent)]" />
                        <span className="relative block w-full h-full rounded-full bg-[var(--accent-bright)] ring-2 ring-[var(--surface-1)]" />
                    </span>
                )}
            </span>

            {/* body */}
            <span className="relative min-w-0 flex-1">
                <span className="block font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    {kicker}
                </span>
                {live ? (
                    <span className="flex items-baseline gap-2 mt-1">
                        <span className="font-display text-[26px] font-black tabular-nums text-white leading-none">
                            {animated}
                        </span>
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">{unit}</span>
                    </span>
                ) : (
                    <>
                        <span className="block mt-1 font-display text-[14px] font-bold text-white group-hover:text-[var(--accent)] transition-colors duration-300">
                            {emptyTitle}
                        </span>
                        <span className="block mt-0.5 text-[11px] text-white/35">{emptyBody}</span>
                    </>
                )}
            </span>

            <ArrowRight className="relative w-4 h-4 shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all duration-300" />
        </Link>
    );
}

/** The two "what's new for you" pulses, under the hero. */
export default function HighlightStrip({ highlights }: { highlights: DashboardData["highlights"] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SignalCard
                icon={Bell}
                kicker="From games you follow"
                value={highlights.updates_from_followed}
                unit={highlights.updates_from_followed === 1 ? "new story this week" : "new stories this week"}
                emptyTitle="Nothing new — yet"
                emptyBody="Follow games and their news lands right here"
                href="/games"
            />
            <SignalCard
                icon={CalendarDays}
                kicker="Landing this week"
                value={highlights.releases_this_week}
                unit={highlights.releases_this_week === 1 ? "tracked release" : "tracked releases"}
                emptyTitle="A quiet week"
                emptyBody="Nothing you track ships — see what's coming next"
                href="/calendar"
            />
        </div>
    );
}
