"use client";

import Link from "next/link";
import Image from "next/image";
import type { PlayerCard as PlayerCardData } from "@/lib/types/profile";

/**
 * How serious this player is — the first thing a visitor should read.
 *
 * A visitor's Overview opened on a showcase and a shelf, which together
 * answer "what do they own". Nobody arrives asking that. They arrive asking
 * whether this is a shelf somebody filled in an afternoon or years of
 * playing, and the page had no figure that could tell them apart: 191 games
 * and 3,104 hours across nine years read exactly like 191 games bought last
 * week. Every number here existed already — on the Gamer DNA tab, two clicks
 * away, which is not where a first impression happens.
 *
 * Three figures and a portrait, and each appears only with something behind
 * it. An empty shelf gets nothing at all rather than a row of zeroes, because
 * a zero looks like a measurement and an absence is not one — and with fifty
 * of the fifty-three profiles on the site holding fewer than three games,
 * the empty case is the common one, not the edge.
 */
export default function PlayerCard({ card, platforms }: {
    card: PlayerCardData;
    /** Connected providers — names the store that certified the figures. */
    platforms: string[];
}) {
    const { hours, games_played: played, span, deepest, achievements } = card;

    // Nothing measured, nothing certified: the shelf strip below already says
    // what is owned, and repeating it here in a bigger font is not a summary.
    if (hours === 0 && !achievements) return null;

    // Which store certified these numbers. The sidebar's Platforms card
    // already draws the icon row, so this says it in words instead of putting
    // the same three logos on screen twice.
    const source = ["steam", "playstation", "xbox"]
        .filter((p) => platforms.includes(p))
        .map((p) => (p === "playstation" ? "PlayStation" : p === "xbox" ? "Xbox" : "Steam"))[0] ?? null;

    const figures: { label: string; value: string; sub: string | null }[] = [];

    if (hours > 0) {
        figures.push({
            label: "Hours played",
            value: hours.toLocaleString(),
            sub: `across ${played.toLocaleString()} ${played === 1 ? "game" : "games"}`,
        });
    }

    if (span) {
        // One year on record is a start date, not a range — "2024–2024" reads
        // like a typo.
        figures.push({
            label: "Playing since",
            value: String(span.from),
            sub: span.to > span.from ? `through ${span.to}` : null,
        });
    }

    if (achievements) {
        figures.push({
            label: source ? `${source} achievements` : "Achievements",
            value: achievements.earned.toLocaleString(),
            sub: `${achievements.rate}% of ${achievements.total.toLocaleString()}`,
        });
    }

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
                style={{ background: "radial-gradient(58% 120% at 8% 0%, color-mix(in srgb, var(--accent) 11%, transparent), transparent 62%)" }}
            />

            <div className="relative p-5 md:p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                {/* The one game that took the largest share. A portrait, where
                    the figures beside it are only a measurement. */}
                {deepest && (
                    <div className="flex items-center gap-4 shrink-0">
                        <Link
                            href={`/games/${deepest.slug}`}
                            className="relative w-[72px] aspect-[3/4] rounded-[9px] overflow-hidden border border-white/[0.09] shrink-0 hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition-colors"
                        >
                            {deepest.cover_url && (
                                <Image src={deepest.cover_url} alt={deepest.name} width={160} height={213} unoptimized className="w-full h-full object-cover" />
                            )}
                        </Link>
                        <div className="min-w-0">
                            <p className="font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/50">Most played</p>
                            <Link href={`/games/${deepest.slug}`} className="mt-1 block font-display text-[15px] font-black text-white leading-tight hover:text-[var(--accent)] transition-colors line-clamp-2">
                                {deepest.name}
                            </Link>
                            <p className="mt-1.5 font-display text-[11px] font-bold tabular-nums text-[var(--accent)]">
                                {deepest.hours.toLocaleString()} h
                                <span className="text-white/25"> · {deepest.share}% of everything</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Flex rather than a fixed grid: a profile with hours but no
                    connected platform has two figures, and two figures in a
                    three-column grid leave a hole where a third used to be. */}
                <div className="flex-1 flex flex-wrap gap-x-9 gap-y-4 min-w-0">
                    {figures.map(({ label, value, sub }) => (
                        <div key={label} className="min-w-0 basis-[136px] grow-0">
                            <p className="font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/50 leading-[1.5]">{label}</p>
                            <p className="mt-1 font-display text-[22px] font-black tabular-nums leading-none text-white truncate">{value}</p>
                            {sub && <p className="mt-1.5 text-[10.5px] text-white/45 truncate">{sub}</p>}
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
