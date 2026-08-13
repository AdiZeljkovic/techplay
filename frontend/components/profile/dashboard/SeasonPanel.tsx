"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { Flame, Zap, Coins } from "lucide-react";
import Readout from "@/components/ui/Readout";
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

/**
 * The season, at the top of Progression where it belongs.
 *
 * It has existed for months as a thin strip inside the daily hub, which is why
 * nobody knew a season was running. A season is the frame around everything
 * below it — the quests, the ladder, the badge at the end — so it opens the
 * page rather than hiding inside it.
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
    const start = season.start_date ? new Date(season.start_date).getTime() : null;
    const end = season.end_date ? new Date(season.end_date).getTime() : null;
    const elapsed = start && end && end > start
        ? Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)))
        : null;

    const boosts = [
        season.xp_multiplier > 1 ? { icon: Zap, label: `${season.xp_multiplier}× XP` } : null,
        season.bounty_multiplier > 1 ? { icon: Coins, label: `${season.bounty_multiplier}× Bounty` } : null,
    ].filter(Boolean) as { icon: typeof Zap; label: string }[];

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-5 md:p-6"
            style={{
                background: "var(--surface-2)",
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09)",
            }}
        >
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(72% 120% at 12% 0%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 62%)" }}
            />

            <div className="relative z-10 flex flex-wrap items-start gap-x-6 gap-y-4">
                {/* The dial: how much of the season has gone, as an object
                    rather than a word. */}
                <StatIcon src="/images/profile/v2-season.webp" size={64} idle="pulse" className="hidden sm:block mt-0.5" />

                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-display text-[9.5px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                        <Flame className="w-3.5 h-3.5" /> Current season
                    </p>

                    <h2 className="mt-2 font-display text-[22px] md:text-[26px] font-black uppercase tracking-tight text-white leading-none">
                        {season.name}
                    </h2>

                    {season.description && (
                        <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/45 max-w-[520px]">{season.description}</p>
                    )}

                    {boosts.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap items-center gap-2">
                            {boosts.map(({ icon: Icon, label }) => (
                                <span key={label} className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] font-display text-[10px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="shrink-0 text-right">
                    <Readout label={days === 1 ? "Day left" : "Days left"} value={days} size="lg" animate className="text-right" />
                </div>
            </div>

            {elapsed !== null && (
                <div className="relative z-10 mt-5">
                    <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                        <span
                            className="block h-full rounded-full bg-[var(--accent)] transition-[width] duration-700"
                            style={{ width: `${elapsed}%` }}
                        />
                    </span>
                </div>
            )}
        </section>
    );
}
