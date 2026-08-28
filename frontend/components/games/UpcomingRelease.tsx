"use client";

import { useEffect, useState } from "react";
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

    /*
     * Whether a release is still ahead is decided from the date, not from the
     * countdown.
     *
     * useCountdown starts at zero with done:true and only recalculates inside
     * useEffect, which never runs on the server — so gating on `countdown.done`
     * meant this block rendered nothing into the HTML at all. A reader with
     * JavaScript saw it a moment later; a crawler never did, which defeats the
     * point of moving release intent onto this page.
     */
    const upcoming = released !== null && new Date(released).getTime() > Date.now();

    /*
     * The digits wait for the client; the date does not.
     *
     * Server and client must agree on the first paint, and they cannot agree on
     * a number that counts down. So the sentence a crawler needs renders on the
     * server, and the ticking numbers appear once mounted.
     */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!upcoming || !released) return null;

    const exact = !precision || precision === "day";
    const spelled = new Date(released).toLocaleDateString("en-GB", {
        day: exact ? "numeric" : undefined,
        month: "long",
        year: "numeric",
    });

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

            {/*
              * Always present, and the part that carries meaning without
              * JavaScript: the date itself, in words.
              */}
            <p className="mt-2 text-[15px] text-white/75">
                {spelled}
                {!exact && <span className="text-white/50"> — exact date not announced</span>}
            </p>

            {exact && mounted ? (
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
                            <span className="mt-1 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">
                                {label}
                            </span>
                        </span>
                    ))}
                </div>
            ) : null}

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
