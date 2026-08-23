"use client";

import Link from "next/link";
import { Trophy, Gamepad2, Flame, Monitor } from "lucide-react";
import type { JournalPayload } from "@/lib/types/profile";

type History = JournalPayload["history"];

/** Steam's device keys, spelled the way a person would say them. */
const DEVICE_LABEL: Record<string, string> = {
    windows: "Windows",
    mac: "Mac",
    linux: "Linux",
    deck: "Steam Deck",
    offline: "Offline",
};

/**
 * A year, as tall as the year was busy.
 *
 * Unlocks are the measure rather than hours, because each unlock carries the
 * moment it happened and an hour does not: Steam reports one lifetime total per
 * game and never says when any of it was spent. On the library this was built
 * against, ranking by hours would crown 2024 — a year holding 1,616 hours of
 * which 1,602 belong to an MMO played across five years and closed that one,
 * against 24 achievements in four games. By unlocks, 2022 wins with 292 across
 * nineteen games, which is what actually happened.
 */
function heightOf(unlocks: number, peak: number) {
    if (peak <= 0) return 4;

    return Math.max(4, Math.round((unlocks / peak) * 40));
}

function YearRow({ year, peak }: { year: History["years"][number]; peak: number }) {
    const covers = year.games.filter((g) => g.cover_url).slice(0, 8);
    const finishedNames = year.finished.map((f) => f.name);

    return (
        <section className="relative pl-7">
            {/* the spine, and this year's mark on it */}
            <span aria-hidden className="absolute left-[7px] top-0 bottom-0 w-px bg-white/[0.08]" />
            <span
                aria-hidden
                className="absolute left-0 top-[7px] w-[15px] h-[15px] rounded-full border-2 border-[var(--surface-0)]"
                style={{ background: year.unlocks > 0 ? "var(--accent)" : "rgba(255,255,255,0.18)" }}
            />

            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-[22px] font-black tabular-nums leading-none text-white">{year.year}</h3>

                {/* How busy the year was, drawn rather than described. */}
                <span
                    aria-hidden
                    className="hidden sm:block h-[3px] rounded-full"
                    style={{
                        width: heightOf(year.unlocks, peak) * 4,
                        background: "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 25%, transparent))",
                    }}
                />

                <span className="ml-auto flex items-center gap-3.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/35">
                    {year.unlocks > 0 && (
                        <span className="inline-flex items-center gap-1.5" title={`${year.unlocks} achievements across ${year.unlock_games} games`}>
                            <Trophy className="w-3 h-3 text-amber-400" /> {year.unlocks}
                        </span>
                    )}
                    {year.games_left_off > 0 && (
                        <span className="inline-flex items-center gap-1.5" title="Games you last opened this year">
                            <Gamepad2 className="w-3 h-3" /> {year.games_left_off}
                        </span>
                    )}
                </span>
            </header>

            {finishedNames.length > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 h-[20px] px-2 rounded-[5px] bg-emerald-500/12 font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-emerald-400">
                    <Flame className="w-3 h-3" /> Finished {finishedNames.join(", ")}
                </p>
            )}

            {covers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {covers.map((g) => (
                        <Link
                            key={g.slug}
                            href={`/games/${g.slug}`}
                            title={`${g.name}${g.hours > 0 ? ` · ${g.hours}h` : ""}`}
                            className="group relative w-[52px] aspect-[3/4] rounded-[7px] overflow-hidden border border-white/[0.08] hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors duration-300"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={g.cover_url!} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                            {g.hours > 0 && (
                                <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 bg-black/75 font-display text-[8.5px] font-black tabular-nums text-white/85 text-center">
                                    {g.hours}h
                                </span>
                            )}
                        </Link>
                    ))}
                    {year.games_left_off > covers.length && (
                        <span className="w-[52px] aspect-[3/4] rounded-[7px] border border-dashed border-white/[0.12] flex items-center justify-center font-display text-[10px] font-black tabular-nums text-white/25">
                            +{year.games_left_off - covers.length}
                        </span>
                    )}
                </div>
            )}

            {/* The one figure that needs its caveat next to it, every time. */}
            {year.hours_held > 0 && (
                <p className="mt-2 font-display text-[9px] font-bold uppercase tracking-[0.13em] text-white/20">
                    {year.hours_held.toLocaleString()} h held by those games
                </p>
            )}
        </section>
    );
}

export default function PlayHistory({ history }: { history: History }) {
    const { years, span, totals, devices } = history;

    if (!years.length) {
        return null;
    }

    const peak = Math.max(...years.map((y) => y.unlocks), 0);
    const busiest = peak > 0 ? years.find((y) => y.unlocks === peak) : null;
    const deviceEntries = Object.entries(devices.minutes).filter(([key]) => key !== "offline");
    const topDevice = deviceEntries[0];

    return (
        <div className="space-y-4">
            <div
                className="rounded-[var(--radius-panel)] border overflow-hidden"
                style={{ borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" }}
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px" style={{ background: "var(--line)" }}>
                    {([
                        [Gamepad2, "Hours played", totals.hours.toLocaleString(), "var(--xp-bright)", `across ${totals.games_with_time} games`],
                        [Trophy, "Achievements", totals.unlocks.toLocaleString(), "#fbbf24", null],
                        [Flame, "Busiest year", busiest ? String(busiest.year) : "—", "var(--accent-ink)", busiest ? `${busiest.unlocks} unlocked` : null],
                        [Gamepad2, "Years on record", span ? String(span.to - span.from + 1) : "—", "#60a5fa", span ? `since ${span.from}` : null],
                        [
                            Monitor,
                            "Most played on",
                            topDevice ? DEVICE_LABEL[topDevice[0]] ?? topDevice[0] : "—",
                            "#34d399",
                            // Said out loud: Steam only began attributing hours
                            // to a machine partway through, so the split covers
                            // less than the total and the gap is not lost games.
                            topDevice ? `${devices.attributed_hours.toLocaleString()} h of ${devices.total_hours.toLocaleString()} placed` : null,
                        ],
                    ] as const).map(([Icon, label, value, tint, sub]) => (
                        <div key={label} className="group/bay flex items-center gap-3.5 min-w-0 px-5 py-4" style={{ background: "var(--surface-2)" }}>
                            <span className="shrink-0 w-10 h-10 flex items-center justify-center" style={{ color: tint }}>
                                <Icon className="w-[24px] h-[24px] transition-transform duration-300 group-hover/bay:scale-110" strokeWidth={1.5} />
                            </span>
                            <span className="min-w-0">
                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">{label}</span>
                                <span className="block mt-1 font-display text-[19px] font-black tabular-nums leading-none text-white truncate">{value}</span>
                                {sub && <span className="block mt-1 text-[10.5px] text-white/30 truncate">{sub}</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-7">
                {years.map((year) => (
                    <YearRow key={year.year} year={year} peak={peak} />
                ))}
            </div>

            {/* Provenance, once, at the foot — not on every row. */}
            <p className="pl-7 text-[11px] leading-relaxed text-white/25">
                Built from dates the platforms report: when each game was last opened, when each achievement
                was unlocked, and when you marked something finished. Hours are lifetime totals per game —
                no platform reports how many of them fell in a given year.
            </p>
        </div>
    );
}
