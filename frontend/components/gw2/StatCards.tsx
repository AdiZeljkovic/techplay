"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Meter from "@/components/ui/Meter";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import type { Gw2Dashboard } from "@/lib/gw2";

/**
 * Five readouts across the top of the dashboard: a label, a large figure, a
 * line under it and, where there is something to count towards, a bar.
 *
 * The figures are ours, not the mockup's: "2,847 achievement points, 48%
 * complete" is not a percentage of anything countable, and "Fractal Level 37 ·
 * Tier 4" gets the tier wrong — 37 is Tier 2. Each card reports something read
 * off the account, and where a card would need a total we do not have, it
 * reports a count instead of a percentage. A bar that is honest about measuring
 * nine of twelve slots is worth more than a percentage that had to invent its
 * own denominator.
 *
 * Each card opens the page that says the rest. The domain's colour is in the
 * bar and nowhere else — Guild Wars 2 already colours these subjects and
 * players know the colours, but five tinted cards in a row read as decoration.
 */

interface CardProps {
    label: string;
    value: ReactNode;
    detail: string;
    /** The page that says the rest. */
    href: string;
    children?: ReactNode;
}

function Card({ label, value, detail, href, children }: CardProps) {
    return (
        <Link
            href={href}
            className="flex flex-col gap-3 rounded-[var(--radius-panel)] border p-4 transition-colors hover:border-[var(--ink-faint)]"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            <div className="min-w-0">
                <div className="truncate text-xs font-medium text-[var(--ink-low)]">{label}</div>
                <div className="mt-1.5 font-numeric text-[28px] font-semibold leading-none text-[var(--ink-hi)]">{value}</div>
                <div className="mt-1.5 text-xs text-[var(--ink-low)]">{detail}</div>
            </div>

            {children && <div className="mt-auto">{children}</div>}
        </Link>
    );
}

export default function StatCards({ dashboard }: { dashboard: Gw2Dashboard }) {
    const { masteries, gear, fractals, achievements, vault } = dashboard.cards;

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <Card
                href="/gw2/masteries"
                label="Mastery points"
                value={masteries.unspent_total}
                detail={
                    masteries.unspent_total > 0
                        ? "unspent, across " + masteries.regions.filter((r) => r.unspent > 0).length + " regions"
                        : "nothing waiting to be spent"
                }
            >
                {/*
                 * Regions, not a total bar. Points are earned and spent per
                 * region and do not move between them, so a single bar over the
                 * account would be measuring a quantity that does not exist.
                 */}
                <ul className="space-y-1 text-[11px]">
                    {masteries.regions.slice(0, 3).map((region) => (
                        <li key={region.region} className="flex justify-between gap-2">
                            <span className="truncate text-[var(--ink-low)]">{region.region}</span>
                            <span className="font-numeric text-[var(--ink-mid)]">
                                {region.unspent > 0 ? `${region.unspent} free` : "spent"}
                            </span>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card
                href="/gw2/fractals"
                label="Fractal level"
                value={fractals?.personal_level ?? "—"}
                detail={
                    /*
                     * The tier is the game's own grouping — 25 scales each, the
                     * same tiers the daily fractals are named by — and the
                     * backend's Fractals::tier(). What is still not named is the
                     * Agony Resistance each scale recommends: that is not in the
                     * API, and it would be the first invented number in the tool.
                     */
                    fractals?.personal_level
                        ? `personal level · Tier ${Math.min(4, Math.floor((fractals.personal_level - 1) / 25) + 1)}`
                        : "no fractals recorded"
                }
            />

            <Card
                href="/gw2/fractals"
                label="Agony Resistance"
                value={
                    <>
                        {fractals?.agony_resistance ?? 0}
                        <span className="text-base font-normal text-[var(--ink-low)]"> / {fractals?.tier_4_target ?? 150}</span>
                    </>
                }
                detail={
                    fractals && fractals.shortfall > 0
                        ? `${fractals.shortfall} more for the Tier 4 target`
                        : "at the Tier 4 target"
                }
            >
                <Meter
                    value={fractals?.agony_resistance ?? 0}
                    max={fractals?.tier_4_target ?? 150}
                    size="sm"
                    tone={DOMAIN_TONE.fractals}
                />
            </Card>

            <Card
                href="/gw2/ascended"
                label="Ascended gear"
                value={
                    <>
                        {gear?.ascended_core ?? 0}
                        <span className="text-base font-normal text-[var(--ink-low)]"> / {gear?.core_slots ?? 12}</span>
                    </>
                }
                detail={
                    // Twelve core slots: six armour, six trinkets. Gathering
                    // tools and aquatic gear sit in the same equipment array and
                    // belong to no ascended figure.
                    gear ? "armour and trinket slots" : "no character read yet"
                }
            >
                <Meter
                    value={gear?.ascended_core ?? 0}
                    max={gear?.core_slots ?? 12}
                    size="sm"
                    tone={DOMAIN_TONE.gear}
                />
            </Card>

            <Card
                href="/gw2/achievements"
                label="Nearly done"
                value={achievements.one_step_away}
                detail={
                    achievements.one_step_away === 1
                        ? "achievement one step from finishing"
                        : `achievements one step away, of ${achievements.nearly_done} past 80%`
                }
            >
                {vault && vault.unclaimed_acclaim > 0 && (
                    <p className="text-[11px] text-[var(--accent-ink)]">
                        {vault.unclaimed_acclaim} acclaim earned and unclaimed
                    </p>
                )}
            </Card>
        </div>
    );
}
