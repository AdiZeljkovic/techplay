"use client";

import { Award, Gem, Layers, Shield, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import Meter from "@/components/ui/Meter";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import type { Gw2Dashboard } from "@/lib/gw2";

/**
 * Five readouts across the top of the dashboard.
 *
 * The mockup draws five too, and three of its numbers are not ones this tool can
 * honestly produce: "Mastery Progress 73%" has no denominator we hold, "2,847
 * achievement points, 48% complete" is neither what the API returns nor a
 * percentage of anything countable, and "Fractal Level 37 · Tier 4" states a tier
 * from a scale we have no published mapping for.
 *
 * So the layout is the mockup's and the figures are ours. Each card reports
 * something read off the account, and where a card would need a total we do not
 * have, it reports a count instead of a percentage. A bar that is honest about
 * measuring nine of twelve slots is worth more than a percentage that had to
 * invent its own denominator.
 */

interface CardProps {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    detail: string;
    /**
     * The domain this card belongs to.
     *
     * Five cards in one accent read as one object cut into five. Guild Wars 2
     * already colours these subjects and players already know the colours, so
     * the cards borrow them: gear pink, fractals violet, masteries green.
     */
    tone: string;
    children?: ReactNode;
}

function Card({ icon, label, value, detail, tone, children }: CardProps) {
    return (
        <div
            className="relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-card)] border p-4"
            style={{
                background: "var(--surface-2)",
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            {/* A rail rather than a tinted card. The number stays the thing
                being read; the colour only says which of the five this is. */}
            <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-[2px]"
                style={{ background: tone }}
            />

            <div className="flex items-center gap-2.5">
                <span aria-hidden style={{ color: tone }}>
                    {icon}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-low)]">
                    {label}
                </span>
            </div>

            <div>
                <div className="font-numeric text-2xl leading-none text-[var(--ink-hi)]">{value}</div>
                <div className="mt-1.5 text-xs text-[var(--ink-low)]">{detail}</div>
            </div>

            {children}
        </div>
    );
}

export default function StatCards({ dashboard }: { dashboard: Gw2Dashboard }) {
    const { masteries, gear, fractals, achievements, vault } = dashboard.cards;

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Card
                icon={<Sparkles size={15} />}
                tone={DOMAIN_TONE.masteries}
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
                icon={<Layers size={15} />}
                tone={DOMAIN_TONE.fractals}
                label="Fractal level"
                value={fractals?.personal_level ?? "—"}
                detail={
                    /*
                     * No tier label. The per-scale requirements are not in the
                     * API and not in our catalogue, so naming a tier here would
                     * be the first invented number in the tool.
                     */
                    fractals?.personal_level ? "personal level" : "no fractals recorded"
                }
            />

            <Card
                icon={<Gem size={15} />}
                tone={DOMAIN_TONE.fractals}
                label="Agony Resistance"
                value={
                    <>
                        {fractals?.agony_resistance ?? 0}
                        <span className="text-base text-[var(--ink-low)]"> / {fractals?.tier_4_target ?? 150}</span>
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
                icon={<Shield size={15} />}
                tone={DOMAIN_TONE.gear}
                label="Ascended gear"
                value={
                    <>
                        {gear?.ascended_core ?? 0}
                        <span className="text-base text-[var(--ink-low)]"> / {gear?.core_slots ?? 12}</span>
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
                icon={<Award size={15} />}
                tone={DOMAIN_TONE.achievements}
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
