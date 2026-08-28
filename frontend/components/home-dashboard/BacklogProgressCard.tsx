"use client";

import Link from "next/link";
import { Gamepad2, Wand2, ListPlus, ArrowRight } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import RingMeter from "@/components/ui/RingMeter";
import { useCountUp } from "@/hooks/useCountUp";
import type { BacklogSuggestion, DashboardStats } from "@/lib/types/dashboard";

/**
 * The three shelf states, in the order the bar draws them.
 *
 * Playing and Completed used to be #34d399 and #22c55e — two greens a shade
 * apart, sitting in a bar that put one at each end, so the panel read as green,
 * blue, green and the key told you nothing. They are separated by meaning now,
 * out of the project's own tokens:
 *
 *   completed — success, the same green as the ring, because "% cleared" and
 *               this segment are one fact told twice
 *   playing   — warning amber, the colour a thing in flight wears
 *   backlog   — plain white at low alpha: it is 88 of 95 items here, and a
 *               loud colour on that share turns the bar into one block
 *
 * Order matters as much as hue: earned on the left, still to come on the
 * right, so the bar fills the way a progress bar is read.
 */
const SHELF = [
    { label: "Completed", tone: "var(--success)", key: "completed_count" },
    { label: "Playing", tone: "var(--warning)", key: "playing_count" },
    { label: "Backlog", tone: "rgba(255,255,255,0.26)", key: "backlog_count" },
] as const;

export default function BacklogProgressCard({
    stats,
    suggestion,
}: {
    stats: DashboardStats;
    suggestion: BacklogSuggestion | null;
}) {
    const total = stats.playing_count + stats.backlog_count + stats.completed_count;
    const percent = total > 0 ? Math.round((stats.completed_count / total) * 100) : 0;

    // This panel charts a backlog being cleared. The guard used to ask whether
    // the whole library was empty, so somebody with one game in progress and
    // nothing else got the full layout with three zeros in it and a void
    // where the suggestion goes. Nothing to clear and nothing cleared is the
    // condition that actually has nothing to draw.
    const isEmpty = stats.backlog_count === 0 && stats.completed_count === 0;

    // the ring draws and the counters climb together
    const ringValue = useCountUp(percent, 1100);
    const monthCount = useCountUp(stats.completed_this_month, 900);

    // A backlog of zero has nothing to chart and the advisor rejects it (422),
    // so show the way in instead of a row of zeros.
    if (isEmpty) {
        return (
            <Panel
                title="Campaign Progress"
                className="h-full flex flex-col"
                bodyClassName="p-5 flex-1 flex flex-col"
            >
                <EmptyState
                    icon={<ListPlus className="w-[18px] h-[18px]" />}
                    title="Your backlog is empty"
                    body="Add games you plan to play and this turns into a progress tracker — plus AI picks for what to start next."
                    action={{ label: "Build your backlog", href: "/games", icon: <ListPlus className="w-3.5 h-3.5" /> }}
                />
            </Panel>
        );
    }

    return (
        <Panel
            title="Campaign Progress"
            variant="console"
            className="h-full flex flex-col"
            bodyClassName="p-5 flex-1 flex flex-col"
        >
            {/* The reading and its breakdown, side by side.
                Before, two of the three shelf figures were printed as huge
                counters at the top and then all three again as a legend under
                the bar — the same numbers twice, in two type sizes, saying
                different things about which mattered. One table now, keyed to
                the bar by colour. */}
            <div className="flex items-center gap-5 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-4">
                <RingMeter value={ringValue} size={104} strokeWidth={8} color="var(--success)">
                    <span className="font-display text-[22px] font-black tabular-nums leading-none" style={{ color: "var(--success)" }}>{ringValue}%</span>
                    <span className="mt-1 font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/55">Cleared</span>
                </RingMeter>

                <dl className="flex-1 min-w-0 divide-y divide-white/[0.05]">
                    {SHELF.map(({ label, tone, key }) => (
                        <div key={label} className="flex items-center gap-2.5 py-[7px] first:pt-0 last:pb-0">
                            <span aria-hidden className="w-[3px] h-[15px] rounded-full shrink-0" style={{ background: tone }} />
                            <dt className="flex-1 font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/55">{label}</dt>
                            <dd className="font-display text-[17px] font-black tabular-nums leading-none text-white">{stats[key]}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Where the library stands, which is the one thing this panel
                always has to say. Without it, a member with no suggestion
                waiting got a row of counters and then empty panel down to the
                button. */}
            <div className="mt-4">
                <div className="flex h-[10px] gap-[2px] rounded-full overflow-hidden bg-[var(--track)]">
                    {SHELF.map(({ label, tone, key }) =>
                        stats[key] > 0 ? (
                            <span
                                key={label}
                                title={`${label}: ${stats[key]}`}
                                className="transition-[width] duration-700 ease-[var(--ease-hud)]"
                                style={{
                                    width: `${(stats[key] / Math.max(1, total)) * 100}%`,
                                    // Two games out of ninety-five is 2% of the
                                    // rail. Without a floor it is a hairline and
                                    // the shelf state it stands for looks empty.
                                    minWidth: 6,
                                    background: tone,
                                }}
                            />
                        ) : null
                    )}
                </div>

                {/* The pace line — the only figure here that is about the month
                    rather than the pile, so it gets its own sentence instead of
                    a counter competing with the shelf. */}
                <p className="mt-2.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                    <span className="tabular-nums text-[var(--accent)]">{monthCount}</span>{" "}
                    {stats.completed_this_month === 1 ? "game" : "games"} finished this month
                </p>
            </div>

            {/* Suggested next — from the shelf, not the catalog. The panel next
                to this one recommends games you do not own; this one is the
                pile you already committed to, so the label says which. */}
            {suggestion && (
                <div className="mt-4">
                    <p className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 mb-2">
                        <span aria-hidden className="w-1 h-3 rounded-full bg-[var(--accent)]" />
                        Start next from your backlog
                    </p>
                    <Link
                        href={`/games/${suggestion.slug}`}
                        prefetch={false}
                        className="group relative flex items-center gap-3.5 rounded-[12px] border border-white/[0.07] p-3 overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                    >
                        {/* the pick's own art, faint, as the row's backdrop */}
                        {suggestion.cover_url ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={suggestion.cover_url}
                                    alt=""
                                    aria-hidden
                                    className="absolute inset-0 w-full h-full object-cover opacity-[0.14] group-hover:opacity-[0.22] transition-opacity duration-500"
                                />
                                {/* Scrim in the console's own face colour. This used to
                                    append a hex alpha onto a var() — `var(--surface-1)e0`,
                                    which is not a colour, so the middle and right stops
                                    dropped and the art ran unscrimmed under the title. */}
                                <span
                                    aria-hidden
                                    className="absolute inset-0"
                                    style={{
                                        background:
                                            "linear-gradient(90deg, var(--surface-1) 0%, color-mix(in srgb, var(--surface-1) 88%, transparent) 55%, color-mix(in srgb, var(--surface-1) 62%, transparent) 100%)",
                                    }}
                                />
                            </>
                        ) : (
                            <span aria-hidden className="absolute inset-0 bg-white/[0.02]" />
                        )}

                        <span className="relative w-[96px] h-[58px] rounded-[9px] overflow-hidden shrink-0 bg-[var(--fill-1)] border border-white/[0.07]">
                            {suggestion.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={suggestion.cover_url}
                                    alt={suggestion.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-[var(--ink-faint)]" /></span>
                            )}
                        </span>

                        <span className="relative min-w-0 flex-1">
                            <span className="block font-display text-[14px] font-black text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-300">
                                {suggestion.name}
                            </span>
                            {(suggestion.genres.length > 0 || suggestion.match_percent !== null) && (
                                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    {suggestion.genres.slice(0, 2).map((g) => (
                                        <span key={g} className="inline-flex items-center h-[19px] px-1.5 rounded-[5px] bg-white/[0.05] border border-white/[0.07] text-[9.5px] font-semibold text-white/50">
                                            {g}
                                        </span>
                                    ))}
                                    {/* taste-match is progression data — it wears violet */}
                                    {suggestion.match_percent !== null && (
                                        <span className="inline-flex items-center h-[19px] px-2 rounded-[5px] bg-[color-mix(in_srgb,var(--xp)_14%,transparent)] border border-[color-mix(in_srgb,var(--xp)_32%,transparent)] font-display text-[9.5px] font-black tabular-nums text-[var(--xp-bright)]">
                                            {suggestion.match_percent}% match
                                        </span>
                                    )}
                                </span>
                            )}
                        </span>

                        <ArrowRight className="relative w-4 h-4 shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all duration-300" />
                    </Link>
                </div>
            )}

            <div className="mt-auto pt-4">
                <Link
                    href="/backlog-advisor"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[11px] font-bold uppercase tracking-wider text-[var(--ink-hi)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                >
                    <Wand2 className="w-4 h-4" /> Open Backlog Advisor
                </Link>
            </div>
        </Panel>
    );
}
