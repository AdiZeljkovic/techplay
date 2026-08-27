"use client";

import { BellRing, CalendarClock } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useReleaseReminder } from "@/hooks/useReleaseReminder";

/**
 * The countdown and the reminder, on the page that should own them.
 *
 * /calendar/{slug} and /games/{slug} describe the same game from the same
 * database row, and the calendar view was the thinner of the two — 1,764
 * visible characters against 2,700, 82% of its words shared, and 36 of its
 * own, most of them other games' names in a sidebar. Both claimed to be
 * canonical, which is a duplicate nobody saw only because nothing links to the
 * calendar page and no sitemap mentions it.
 *
 * The calendar page now points its canonical here. That is only half an
 * answer, though: it had one thing this page did not, and deleting a working
 * feature to fix a metadata problem would be a poor trade. So the reminder
 * moves here, and the countdown — which neither page had — comes with it.
 *
 * Only for releases still ahead of us. A countdown to a date in the past is
 * noise, and 1,519 of the 2,924 games in the calendar have already shipped.
 */
export default function UpcomingRelease({
    slug,
    name,
    released,
    precision,
}: {
    slug: string;
    name: string;
    /** ISO date. Anything in the past renders nothing. */
    released: string | null;
    /** "day" is the only precision worth counting down to. */
    precision?: string | null;
}) {
    const countdown = useCountdown(released);
    const { toggle, busy } = useReleaseReminder(slug);

    if (!released || countdown.done) return null;

    const exact = !precision || precision === "day";

    return (
        <section
            aria-labelledby="upcoming-heading"
            className="mt-6 rounded-[14px] border border-white/[0.09] bg-[var(--surface-1)] p-4 sm:p-5"
        >
            <h2
                id="upcoming-heading"
                className="flex items-center gap-2 font-display text-[10.5px] font-black uppercase tracking-[0.14em] text-white/45"
            >
                <CalendarClock className="w-3.5 h-3.5 text-[var(--accent)]" />
                {exact ? "Releases in" : "Expected"}
            </h2>

            {exact ? (
                <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
                    {([
                        ["days", countdown.days],
                        ["hours", countdown.hours],
                        ["minutes", countdown.minutes],
                    ] as const).map(([label, value]) => (
                        <span key={label} className="flex flex-col">
                            <span className="font-display text-[26px] font-black leading-none tabular-nums text-white">
                                {value}
                            </span>
                            <span className="mt-1 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/35">
                                {label}
                            </span>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="mt-2 text-[14px] text-white/70">
                    {new Date(released).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    <span className="text-white/35"> — exact date not announced</span>
                </p>
            )}

            <button
                type="button"
                onClick={toggle}
                disabled={busy}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-[9px] border border-white/[0.12] bg-white/[0.04] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/80 hover:text-white hover:border-white/25 disabled:opacity-40 transition-colors"
            >
                <BellRing className="w-3.5 h-3.5" />
                Remind me about {name}
            </button>
        </section>
    );
}
