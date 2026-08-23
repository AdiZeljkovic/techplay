"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock3, Trophy, CalendarRange, Monitor, Layers } from "lucide-react";
import type { GamerDnaPayload } from "@/lib/types/profile";

const DEVICE_LABEL: Record<string, string> = {
    windows: "Windows",
    mac: "Mac",
    linux: "Linux",
    deck: "Steam Deck",
    offline: "Offline",
};

/**
 * What the shelf did, which the rest of this page never asked.
 *
 * Every other section here is derived from how many games a library holds and
 * what status each carries — the identity, the axes, the score. None of them
 * had ever read a single hour, so a reader with 3,104 of them across 102 games
 * and nine years on record was summed up as somebody who buys games.
 *
 * Two figures carry their own caveat, and both say it out loud rather than
 * hoping nobody checks. The median is a median because one MMO holding 1,602
 * hours drags a mean far enough to describe nobody. And the device split
 * covers less than the total, because Steam only began attributing playtime to
 * a machine partway through — unexplained, that gap reads as missing games.
 */
export default function DnaPlaySection({ play, platform }: {
    play: GamerDnaPayload["play"];
    platform: GamerDnaPayload["platform_achievements"];
}) {
    if (play.hours === 0 && platform.total === 0) return null;

    const devices = Object.entries(play.devices.minutes).filter(([k]) => k !== "offline");
    const topDevice = devices[0];
    const deepest = play.deepest;

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border"
            style={{
                background: "var(--surface-2)",
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(62% 130% at 10% 0%, color-mix(in srgb, var(--xp) 12%, transparent), transparent 64%)" }}
            />

            <div className="relative p-5 md:p-6">
                <p className="font-display text-[9.5px] font-black uppercase tracking-[0.2em] text-[var(--xp-bright)]">
                    What the hours say
                </p>

                <div className="mt-4 flex flex-col lg:flex-row gap-6">
                    {/* The one game that took most of a life on this shelf. It
                        leads because a genre chart says "you like RPGs" and
                        this says which one got a quarter of your decade. */}
                    {deepest && (
                        <div className="flex items-center gap-4 shrink-0">
                            <Link
                                href={`/games/${deepest.slug}`}
                                className="relative w-[76px] aspect-[3/4] rounded-[9px] overflow-hidden border border-white/[0.09] shrink-0 hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition-colors"
                            >
                                {deepest.cover_url && (
                                    <Image src={deepest.cover_url} alt={deepest.name} width={160} height={213} unoptimized className="w-full h-full object-cover" />
                                )}
                            </Link>
                            <div className="min-w-0">
                                <p className="font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/30">Deepest</p>
                                <Link href={`/games/${deepest.slug}`} className="mt-1 block font-display text-[15px] font-black text-white leading-tight hover:text-[var(--accent)] transition-colors line-clamp-2">
                                    {deepest.name}
                                </Link>
                                <p className="mt-1.5 font-display text-[11px] font-bold tabular-nums text-[var(--xp-bright)]">
                                    {deepest.hours.toLocaleString()} h
                                    <span className="text-white/25"> · {deepest.share}% of everything</span>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-4">
                        {([
                            [Clock3, "Hours played", play.hours.toLocaleString(), `across ${play.games_played} games`, "var(--xp-bright)"],
                            [
                                Layers,
                                "Typical game",
                                play.median_hours === null ? "—" : `${play.median_hours} h`,
                                "median, not average",
                                "#60a5fa",
                            ],
                            [
                                CalendarRange,
                                "Years playing",
                                play.span ? String(play.span.years_active) : "—",
                                play.span ? `${play.span.from}–${play.span.to}` : null,
                                "#34d399",
                            ],
                            [
                                Trophy,
                                "Platform trophies",
                                platform.earned.toLocaleString(),
                                platform.total > 0
                                    ? `${platform.rate}% of ${platform.total.toLocaleString()}`
                                    : null,
                                "#fbbf24",
                            ],
                        ] as const).map(([Icon, label, value, sub, tint]) => (
                            <div key={label} className="min-w-0">
                                <p className="flex items-center gap-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/30">
                                    <Icon className="w-3 h-3" style={{ color: tint }} strokeWidth={1.8} />
                                    {label}
                                </p>
                                <p className="mt-1 font-display text-[19px] font-black tabular-nums leading-none text-white truncate">{value}</p>
                                {sub && <p className="mt-1 text-[10.5px] text-white/25 truncate">{sub}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                {(platform.perfected > 0 || topDevice) && (
                    <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-x-7 gap-y-2 font-display text-[10px] font-bold uppercase tracking-[0.13em] text-white/30">
                        {platform.perfected > 0 && (
                            <span className="inline-flex items-center gap-2">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.7} />
                                <span className="text-white/60">{platform.perfected}</span>
                                {platform.perfected === 1 ? "game with nothing left in it" : "games with nothing left in them"}
                            </span>
                        )}
                        {topDevice && (
                            <span className="inline-flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.7} />
                                <span className="text-white/60">{DEVICE_LABEL[topDevice[0]] ?? topDevice[0]}</span>
                                {/* The coverage, stated. Steam placed only some
                                    of these hours on a machine. */}
                                <span className="text-white/20">
                                    {play.devices.placed_hours.toLocaleString()} h of {play.devices.total_hours.toLocaleString()} placed
                                </span>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
