"use client";

import Link from "next/link";
import { Trophy, Flame, Monitor, Clock3 } from "lucide-react";
import type { JournalPayload } from "@/lib/types/profile";

type History = JournalPayload["history"];
type Year = History["years"][number];

/** Steam's device keys, spelled the way a person would say them. */
const DEVICE_LABEL: Record<string, string> = {
    windows: "Windows",
    mac: "Mac",
    linux: "Linux",
    deck: "Steam Deck",
    offline: "Offline",
};

/**
 * A decade of playing, and the two rules it is drawn by.
 *
 * **Years are measured in unlocks, never in hours.** An unlock carries the
 * minute it happened; an hour does not, because Steam reports one lifetime
 * total per game and never says when any of it was spent. Ranked by hours this
 * library would crown 2024 at 1,616 — of which 1,602 belong to an MMO played
 * across five years and closed that one, against 24 achievements in four
 * games. By unlocks 2022 wins with 292 across nineteen, which is what happened.
 *
 * **A year is only as tall as it was busy.** The first draft gave every year
 * the same block and the same row of identical thumbnails, so a decade read as
 * a list rather than a shape: the year you barely played looked like the year
 * you barely stopped. Now the ridge shows the whole span at once, the covers
 * are ranked by the hours they hold, and a year with almost nothing in it
 * collapses to a single line instead of being padded out to match.
 */

/* ── the ridge ────────────────────────────────────────────────────────────
 *
 * Every year as one bar, oldest to newest — the shape of a decade before any
 * of the detail. It is the only place hours are deliberately not used: this is
 * a picture of when somebody was playing, and hours cannot say when.
 */
function Ridge({ years, peak }: { years: Year[]; peak: number }) {
    const chronological = [...years].reverse();

    return (
        <div className="flex items-end gap-[3px] h-[64px]" aria-hidden>
            {chronological.map((y) => {
                const share = peak > 0 ? y.unlocks / peak : 0;
                const height = Math.max(3, Math.round(share * 64));

                return (
                    <span key={y.year} className="group/bar relative flex-1 flex flex-col justify-end" title={`${y.year} · ${y.unlocks} achievements`}>
                        <span
                            className="w-full rounded-t-[3px] transition-[height,filter] duration-500 group-hover/bar:brightness-125"
                            style={{
                                height,
                                background: share > 0.6
                                    ? "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 45%, transparent))"
                                    : share > 0
                                        ? "color-mix(in srgb, var(--accent) 42%, transparent)"
                                        : "rgba(255,255,255,0.09)",
                            }}
                        />
                    </span>
                );
            })}
        </div>
    );
}

/**
 * Covers ranked by the hours they hold, flowing across the full width.
 *
 * They used to cap at seven and sit in a narrow column with the year's meta
 * stacked above them, which on a wide screen left the right half of the page
 * empty and made a decade look like a sidebar. A year is a band now: its
 * figures hold a fixed column on the left, the games run out beside them and
 * use whatever room the screen has.
 */
function Covers({ year, feature }: { year: Year; feature: boolean }) {
    const ranked = [...year.games].filter((g) => g.cover_url).sort((a, b) => b.hours - a.hours);

    if (!ranked.length) return null;

    const shown = ranked.slice(0, feature ? 16 : 12);
    const rest = year.games_left_off - shown.length;

    return (
        <div className="flex flex-wrap items-end gap-2">
            {shown.map((g, i) => {
                // The year's defining game is bigger and wears its name; on a
                // slow year nothing is worth featuring, so they stay level.
                const width = feature && i === 0 ? 104 : feature && i < 3 ? 72 : 56;

                return (
                    <Link
                        key={g.slug}
                        href={`/games/${g.slug}`}
                        title={`${g.name}${g.hours > 0 ? ` · ${g.hours.toLocaleString()}h` : ""}`}
                        className="group relative rounded-[8px] overflow-hidden border border-white/[0.09] hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition-colors duration-300"
                        style={{ width, aspectRatio: "3 / 4" }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={g.cover_url!}
                            alt={g.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-500 ease-[var(--ease-hud)]"
                        />
                        {feature && i === 0 ? (
                            <>
                                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                <span className="absolute inset-x-0 bottom-0 p-1.5">
                                    <span className="block font-display text-[9.5px] font-black uppercase tracking-[0.06em] text-white leading-tight line-clamp-2">
                                        {g.name}
                                    </span>
                                    {g.hours > 0 && (
                                        <span className="mt-0.5 block font-display text-[9px] font-bold tabular-nums text-[var(--accent-ink)]">
                                            {g.hours.toLocaleString()}h
                                        </span>
                                    )}
                                </span>
                            </>
                        ) : g.hours > 0 ? (
                            <span className="absolute inset-x-0 bottom-0 px-1 py-[3px] bg-black/75 font-display text-[8.5px] font-black tabular-nums text-white/80 text-center">
                                {g.hours.toLocaleString()}h
                            </span>
                        ) : null}
                    </Link>
                );
            })}

            {rest > 0 && (
                <span className="w-[56px] aspect-[3/4] rounded-[8px] border border-dashed border-white/[0.14] flex items-center justify-center font-display text-[11px] font-black tabular-nums text-white/25">
                    +{rest}
                </span>
            )}
        </div>
    );
}

/** A year with almost nothing in it earns a line, not a block. */
function QuietYear({ year }: { year: Year }) {
    const bits = [
        year.unlocks > 0 ? `${year.unlocks} achievement${year.unlocks === 1 ? "" : "s"}` : null,
        year.games_left_off > 0 ? `${year.games_left_off} game${year.games_left_off === 1 ? "" : "s"} set down` : null,
    ].filter(Boolean);

    return (
        <div className="relative pl-11 py-1.5 flex items-baseline gap-3">
            <span aria-hidden className="absolute left-[15px] top-0 bottom-0 w-px bg-white/[0.07]" />
            <span aria-hidden className="absolute left-[12px] top-[9px] w-[7px] h-[7px] rounded-full bg-white/15" />
            <span className="font-display text-[13px] font-black tabular-nums text-white/35">{year.year}</span>
            <span className="text-[11.5px] text-white/25">{bits.join(" · ") || "quiet"}</span>
        </div>
    );
}

function YearBlock({ year, peak }: { year: Year; peak: number }) {
    const share = peak > 0 ? year.unlocks / peak : 0;

    return (
        <section className="relative pl-11">
            <span aria-hidden className="absolute left-[15px] top-0 bottom-0 w-px bg-white/[0.07]" />
            {/* The node carries the year's weight: a lit ring on a busy year,
                a plain dot on a slow one. */}
            <span
                aria-hidden
                className="absolute left-[9px] top-[8px] w-[13px] h-[13px] rounded-full border-2 border-[var(--surface-0)]"
                style={{
                    background: share > 0 ? "var(--accent)" : "rgba(255,255,255,0.2)",
                    boxShadow: share > 0.6 ? "0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent)" : undefined,
                }}
            />

            {/* A band, not a stack. The figures hold a fixed column and the
                games run out beside them for as far as the screen allows —
                stacked, they left the right half of a wide page empty and made
                ten years read as a narrow list down one edge. */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-x-6 gap-y-3">
                <header className="lg:w-[168px] shrink-0">
                    <h3
                        className="font-display font-black tabular-nums leading-none text-white"
                        style={{ fontSize: share > 0.6 ? 38 : 28 }}
                    >
                        {year.year}
                    </h3>

                    <div className="mt-2 flex lg:flex-col flex-wrap items-baseline lg:items-start gap-x-4 gap-y-1 font-display text-[10px] font-bold uppercase tracking-[0.13em] tabular-nums">
                        {year.unlocks > 0 && (
                            <span className="text-amber-400/90">
                                {year.unlocks} <span className="text-white/25">unlocked in {year.unlock_games}</span>
                            </span>
                        )}
                        {year.games_left_off > 0 && (
                            <span className="text-white/35">
                                {year.games_left_off} <span className="text-white/20">set down</span>
                            </span>
                        )}
                        {year.hours_held > 0 && (
                            <span className="text-white/[0.22]">
                                {year.hours_held.toLocaleString()} h <span className="text-white/[0.15]">held</span>
                            </span>
                        )}
                    </div>

                    {year.finished.length > 0 && (
                        <p className="mt-2.5 inline-flex items-start gap-1.5 py-1 px-2 rounded-[5px] bg-emerald-500/[0.14] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-emerald-400 leading-snug">
                            <Flame className="w-3 h-3 mt-[1px] shrink-0" />
                            <span>Finished {year.finished.map((f) => f.name).join(", ")}</span>
                        </p>
                    )}
                </header>

                <div className="min-w-0 flex-1">
                    <Covers year={year} feature={share > 0.35} />
                </div>
            </div>
        </section>
    );
}

export default function PlayHistory({ history }: { history: History }) {
    const { years, span, totals, devices } = history;

    if (!years.length) return null;

    const peak = Math.max(...years.map((y) => y.unlocks), 0);
    const busiest = peak > 0 ? years.find((y) => y.unlocks === peak) : null;
    const topDevice = Object.entries(devices.minutes).filter(([k]) => k !== "offline")[0];

    // A year is worth a block when something happened in it. The rest keep
    // their place on the spine without stretching the page.
    const isQuiet = (y: Year) => y.unlocks < Math.max(3, peak * 0.05) && y.games_left_off <= 2;

    return (
        <div className="space-y-6">
            {/* ── the span, as one object ──────────────────────────────────
                Not five boxes in a row like every other panel: a decade
                deserves its own shape. The ridge is the headline and the
                figures read as a sentence beneath it. */}
            <section
                className="relative overflow-hidden rounded-[var(--radius-panel)] border p-5 md:p-6"
                style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--line-strong)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
                }}
            >
                <span
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(70% 130% at 12% 0%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 62%)" }}
                />

                <div className="relative">
                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                        {span ? `${span.to - span.from + 1} years on record` : "Play history"}
                    </p>
                    <h2 className="mt-2 font-display text-[26px] md:text-[34px] font-black uppercase tracking-[-0.015em] leading-none text-white">
                        {totals.hours.toLocaleString()} <span className="text-white/30">hours</span>
                    </h2>
                    <p className="mt-2 text-[12.5px] text-white/40">
                        across {totals.games_with_time} games{span ? `, since ${span.from}` : ""}
                    </p>

                    <div className="mt-5">
                        <Ridge years={years} peak={peak} />
                        <div className="mt-1.5 flex items-center justify-between font-display text-[9px] font-bold uppercase tracking-[0.14em] tabular-nums text-white/25">
                            <span>{span?.from}</span>
                            <span className="text-white/15">achievements unlocked, by year</span>
                            <span>{span?.to}</span>
                        </div>
                    </div>

                    {/* Three readings, on one line, in the site's own idiom. */}
                    <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 pt-4 border-t border-white/[0.06]">
                        <span className="inline-flex items-center gap-2.5">
                            <Trophy className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.6} />
                            <span>
                                <span className="block font-display text-[15px] font-black tabular-nums leading-none text-white">
                                    {totals.unlocks.toLocaleString()}
                                </span>
                                <span className="mt-1 block font-display text-[8.5px] font-bold uppercase tracking-[0.15em] text-white/30">Achievements</span>
                            </span>
                        </span>

                        {busiest && (
                            <span className="inline-flex items-center gap-2.5">
                                <Flame className="w-4 h-4 text-[var(--accent)] shrink-0" strokeWidth={1.6} />
                                <span>
                                    <span className="block font-display text-[15px] font-black tabular-nums leading-none text-white">{busiest.year}</span>
                                    <span className="mt-1 block font-display text-[8.5px] font-bold uppercase tracking-[0.15em] text-white/30">
                                        Busiest · {busiest.unlocks} unlocked
                                    </span>
                                </span>
                            </span>
                        )}

                        {topDevice && (
                            <span className="inline-flex items-center gap-2.5">
                                <Monitor className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.6} />
                                <span>
                                    <span className="block font-display text-[15px] font-black leading-none text-white">
                                        {DEVICE_LABEL[topDevice[0]] ?? topDevice[0]}
                                    </span>
                                    {/* Steam only began attributing hours to a
                                        machine partway through, so the split
                                        covers less than the total. Unexplained,
                                        that gap reads as lost games. */}
                                    <span className="mt-1 block font-display text-[8.5px] font-bold uppercase tracking-[0.15em] text-white/30">
                                        {devices.attributed_hours.toLocaleString()} h of {devices.total_hours.toLocaleString()} placed
                                    </span>
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {/* ── the years ── */}
            <div className="space-y-6">
                {years.map((year) =>
                    isQuiet(year)
                        ? <QuietYear key={year.year} year={year} />
                        : <YearBlock key={year.year} year={year} peak={peak} />
                )}
            </div>

            <p className="pl-11 flex items-start gap-2 text-[11px] leading-relaxed text-white/25">
                <Clock3 className="w-3.5 h-3.5 mt-[1px] shrink-0 text-white/15" />
                <span>
                    Built from dates the platforms report — when each game was last opened, when each achievement
                    was unlocked, and when you marked something finished. Hours are lifetime totals per game: no
                    platform says how many of them fell in a given year, so years are measured in achievements.
                </span>
            </p>
        </div>
    );
}
