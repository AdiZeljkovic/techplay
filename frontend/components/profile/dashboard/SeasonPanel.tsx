"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { Flame, Zap, Coins } from "lucide-react";
import StatIcon from "@/components/home-dashboard/StatIcon";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

interface Season {
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    xp_multiplier: number;
    bounty_multiplier: number;
    days_remaining: number | null;
}

const dayLabel = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * The season, drawn as the thing it is: a run with a start, an end and a
 * position on it.
 *
 * It was a card — a name, a paragraph, two pill-shaped chips and a smooth
 * five-pixel bar, with the day count floating unhoused off the right edge. All
 * true and none of it read as a season. A smooth bar in particular says
 * "loading"; what a season has is weeks, and you are in one of them.
 *
 * So the rail is segmented into the season's own weeks, filled behind you and
 * empty ahead, with the current week lit and a marker on it. The ends carry
 * the two dates that bound the run. The countdown gets a housing of its own,
 * because a number that large with nothing around it is a number that fell
 * off the layout.
 *
 * Renders nothing between seasons. An empty frame saying "no season" is worse
 * than no frame.
 */
export default function SeasonPanel() {
    const { data: season } = useSWR<Season | null>("/seasons/active", fetcher, { revalidateOnFocus: false });

    if (!season) return null;

    const days = Math.max(0, Math.floor(season.days_remaining ?? 0));

    // How far through we are, measured on the calendar rather than on anything
    // the reader did — this is the season's clock, not their progress bar.
    //
    // Derived from days_remaining rather than from the browser's clock. The
    // API already counted the days and prints them in the box beside this
    // rail; computing the same thing a second time from Date.now() lets the
    // two disagree across midnight, over a stale tab, or on a machine whose
    // clock is simply wrong — and reading a rail against a countdown that
    // contradicts it is worse than having neither.
    const start = season.start_date ? new Date(`${season.start_date}T00:00:00`).getTime() : null;
    const end = season.end_date ? new Date(`${season.end_date}T00:00:00`).getTime() : null;
    const totalDays = start !== null && end !== null && end > start
        ? Math.round((end - start) / 86_400_000)
        : null;
    const elapsed = totalDays !== null && totalDays > 0
        ? Math.min(100, Math.max(0, ((totalDays - days) / totalDays) * 100))
        : null;

    // Weeks, capped so a long season does not turn the rail into a hairline
    // comb and a short one does not get four fat blocks.
    const weeks = totalDays !== null ? Math.min(26, Math.max(6, Math.round(totalDays / 7))) : 0;
    const weekNow = elapsed !== null ? Math.min(weeks - 1, Math.floor((elapsed / 100) * weeks)) : -1;

    const boosts = [
        season.xp_multiplier > 1 ? { icon: Zap, label: `${season.xp_multiplier}×`, unit: "XP", tint: "var(--accent-ink)" } : null,
        season.bounty_multiplier > 1 ? { icon: Coins, label: `${season.bounty_multiplier}×`, unit: "Bounty", tint: "#fbbf24" } : null,
    ].filter(Boolean) as { icon: typeof Zap; label: string; unit: string; tint: string }[];

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border"
            style={{
                background: "var(--surface-2)",
                borderColor: "color-mix(in srgb, var(--accent) 34%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09), 0 18px 44px -20px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
        >
            {/* the ground: a bloom from the icon's corner, and hazard stripes
                far enough down in opacity to be texture rather than pattern */}
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(64% 130% at 10% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 64%)" }}
            />
            <span
                aria-hidden
                className="absolute inset-y-0 right-0 w-[42%] pointer-events-none opacity-[0.055]"
                style={{
                    backgroundImage: "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 11px)",
                    maskImage: "linear-gradient(90deg, transparent, #000 70%)",
                    WebkitMaskImage: "linear-gradient(90deg, transparent, #000 70%)",
                }}
            />
            {/* the accent rule along the top edge, the season's own seam */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 20%, transparent) 65%, transparent)" }} />

            <div className="relative z-10 p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
                    <StatIcon src="/images/profile/v2-season.webp" size={82} idle="pulse" className="hidden sm:block shrink-0" />

                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-display text-[9.5px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                            <Flame className="w-3.5 h-3.5" /> Current season
                        </p>

                        <h2 className="mt-2 font-display text-[26px] md:text-[34px] font-black uppercase tracking-[-0.015em] text-white leading-[0.95]">
                            {season.name}
                        </h2>

                        {season.description && (
                            <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/45 max-w-[560px]">{season.description}</p>
                        )}
                    </div>

                    {/* Boosts as instrument bays, not chips. A multiplier is a
                        reading — it deserves a figure and a unit, the way every
                        other number on this profile is drawn. */}
                    {boosts.length > 0 && (
                        <div className="flex items-stretch gap-px rounded-[10px] overflow-hidden shrink-0" style={{ background: "var(--line)" }}>
                            {boosts.map(({ icon: Icon, label, unit, tint }) => (
                                <div key={unit} className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: "var(--surface-1)" }}>
                                    <Icon className="w-4 h-4 shrink-0" style={{ color: tint }} strokeWidth={1.6} />
                                    <span>
                                        <span className="block font-display text-[17px] font-black tabular-nums leading-none" style={{ color: tint }}>{label}</span>
                                        <span className="block mt-1 font-display text-[8px] font-bold uppercase tracking-[0.16em] text-white/50">{unit}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div
                        className="shrink-0 flex flex-col items-center justify-center min-w-[104px] px-4 py-2.5 rounded-[10px] border"
                        style={{
                            background: "var(--surface-1)",
                            borderColor: days <= 7 ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--line-strong)",
                        }}
                    >
                        <span className="font-display text-[38px] font-black tabular-nums leading-none" style={{ color: days <= 7 ? "var(--accent-ink)" : "#fff" }}>
                            {days}
                        </span>
                        <span className="mt-1.5 font-display text-[8px] font-bold uppercase tracking-[0.18em] text-white/50">
                            {days === 1 ? "Day left" : "Days left"}
                        </span>
                    </div>
                </div>

                {/* ── the run ── */}
                {elapsed !== null && (
                    <div className="mt-6">
                        <div className="flex items-center gap-[3px]" aria-hidden>
                            {Array.from({ length: weeks }, (_, i) => {
                                const done = i < weekNow;
                                const now = i === weekNow;

                                return (
                                    <span
                                        key={i}
                                        className="flex-1 rounded-[2px] transition-[background,height] duration-500"
                                        style={{
                                            height: now ? 14 : 8,
                                            background: now
                                                ? "var(--accent)"
                                                : done
                                                    ? "color-mix(in srgb, var(--accent) 42%, transparent)"
                                                    : "rgba(255,255,255,0.07)",
                                            boxShadow: now ? "0 0 14px color-mix(in srgb, var(--accent) 60%, transparent)" : undefined,
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <div className="mt-2.5 flex items-baseline justify-between gap-3 font-display text-[9.5px] font-bold uppercase tracking-[0.14em] tabular-nums">
                            <span className="text-white/50">{season.start_date ? dayLabel(season.start_date) : ""}</span>
                            <span className="text-white/45">
                                Week <span className="text-white">{weekNow + 1}</span> of {weeks}
                                <span className="text-white/20"> · {Math.round(elapsed)}% elapsed</span>
                            </span>
                            <span className="text-white/30">{season.end_date ? dayLabel(season.end_date) : ""}</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
