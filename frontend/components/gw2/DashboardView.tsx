"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Compass, RefreshCw, Zap } from "lucide-react";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Meter from "@/components/ui/Meter";
import StatCards from "@/components/gw2/StatCards";
import RecommendationCard from "@/components/gw2/RecommendationCard";
import GameIcon, { RARITY_COLOUR } from "@/components/gw2/GameIcon";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { getGoals, requestSync, slotLabel, type Gw2Dashboard, type Gw2GoalOption, type Gw2Intent } from "@/lib/gw2";

/**
 * The dashboard, once an account has been read.
 *
 * Laid out as the mockup lays it out — readouts across the top, recommendations
 * in the middle, a narrow rail on the right — with two deliberate departures.
 *
 * The rail's "Tonight in Guild Wars 2" is drawn in the mockup as a minute-by-
 * minute plan: 0–10m the vault, 10–30m fractals, 30–45m gear. We have no basis
 * for any of those timings. What we do have is the Wizard's Vault, which arrives
 * from the game with its own titles, targets and acclaim values and needs no
 * estimating at all, so the rail shows what is actually open rather than a
 * schedule somebody would have had to invent.
 *
 * And there is no completion score anywhere. One figure over five unrelated
 * domains would have to invent both its weights and its denominator.
 */

const AVOIDABLE = [
    { domain: "vault", label: "Wizard's Vault" },
    { domain: "achievements", label: "Achievements" },
    { domain: "masteries", label: "Masteries" },
    { domain: "gear", label: "Gear" },
    { domain: "fractals", label: "Fractals" },
];

const TIMES = [
    { minutes: 30, label: "30 min" },
    { minutes: 120, label: "2 hours" },
    { minutes: null, label: "No limit" },
];

export default function DashboardView({
    dashboard,
    intent,
    onIntentChange,
    onRefresh,
    busy,
}: {
    dashboard: Gw2Dashboard;
    intent: Gw2Intent;
    onIntentChange: (next: Gw2Intent) => void;
    onRefresh: () => void;
    busy: boolean;
}) {
    const [syncing, setSyncing] = useState(false);
    const { account, cards, advice, since_last_sync: history } = dashboard;

    async function sync() {
        setSyncing(true);

        try {
            await requestSync();
            /*
             * The read is queued, not immediate — the game's rate limit belongs
             * to the whole site, so nothing here waits on ArenaNet. Give the
             * worker a moment, then reload. If it is not done, the next refresh
             * catches it.
             */
            await new Promise((resolve) => setTimeout(resolve, 4000));
            onRefresh();
        } finally {
            setSyncing(false);
        }
    }

    function toggleAvoid(domain: string) {
        const avoid = intent.avoid ?? [];

        onIntentChange({
            ...intent,
            avoid: avoid.includes(domain) ? avoid.filter((d) => d !== domain) : [...avoid, domain],
        });
    }

    return (
        <div className="space-y-6">
            <StatCards dashboard={dashboard} />

            {/* The two places a card sends you when its number is the one you
                came to act on. Kept here rather than in the page shell so they
                do not appear beside the connect form, where neither works. */}
            <nav className="flex flex-wrap gap-2">
                <Link
                    href="/gw2/masteries"
                    className="rounded-[var(--radius-inner)] border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--fill-1)]"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-mid)" }}
                >
                    All masteries
                </Link>
                <Link
                    href="/gw2/content"
                    className="rounded-[var(--radius-inner)] border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--fill-1)]"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-mid)" }}
                >
                    Raids &amp; bosses
                </Link>
                <Link
                    href="/gw2/tonight"
                    className="rounded-[var(--radius-inner)] border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--fill-1)]"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-mid)" }}
                >
                    Tonight
                </Link>
                <Link
                    href="/gw2/planner"
                    className="rounded-[var(--radius-inner)] border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--fill-1)]"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-mid)" }}
                >
                    Crafting planner
                </Link>
            </nav>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                    <Panel
                        material="matte"
                        title="What to do next"
                        meta={
                            <span className="text-xs text-[var(--ink-faint)]">
                                {advice.considered} weighed
                            </span>
                        }
                    >
                        <div className="space-y-4">
                            <IntentBar intent={intent} onChange={onIntentChange} onToggleAvoid={toggleAvoid} />

                            {advice.headline.length === 0 ? (
                                <p className="py-6 text-center text-sm text-[var(--ink-low)]">
                                    {advice.considered === 0
                                        ? "Nothing matched right now — which usually means your account is in good shape."
                                        : "Everything we weighed was filtered out. Try relaxing the time limit."}
                                </p>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-3">
                                    {advice.headline.map((recommendation, i) => (
                                        <RecommendationCard
                                            key={recommendation.key + recommendation.subject}
                                            recommendation={recommendation}
                                            featured={i === 0}
                                        />
                                    ))}
                                </div>
                            )}

                            {advice.alternatives.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">
                                        Or instead
                                    </h3>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {advice.alternatives.map((recommendation) => (
                                            <RecommendationCard
                                                key={recommendation.key + recommendation.subject}
                                                recommendation={recommendation}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Panel>

                    {cards.gear && <GearPanel gear={cards.gear} />}
                </div>

                <div className="space-y-5">
                    <Panel
                        material="instrument"
                        title="Open right now"
                        meta={
                            <span className="text-xs text-[var(--ink-faint)]">Wizard&apos;s Vault</span>
                        }
                    >
                        {!cards.vault ? (
                            // Absent is not empty: a key without `progression`
                            // never read the vault at all, and saying "nothing
                            // open" would be inventing that.
                            <p className="text-sm text-[var(--ink-low)]">
                                Your key does not include the <strong>progression</strong> permission, so we
                                cannot read your vault.
                            </p>
                        ) : cards.vault.open.length === 0 ? (
                            <p className="text-sm text-[var(--ink-low)]">
                                Everything is done for this period.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {cards.vault.open.map((objective) => (
                                    <li key={`${objective.period}-${objective.id}`} className="space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-sm leading-snug text-[var(--ink-hi)]">
                                                {objective.title}
                                            </span>
                                            <span className="shrink-0 font-numeric text-xs text-[var(--accent-ink)]">
                                                +{objective.acclaim}
                                            </span>
                                        </div>
                                        <Meter value={objective.current} max={objective.target} size="sm" />
                                        <div className="flex justify-between text-[11px] text-[var(--ink-faint)]">
                                            <span>{objective.period}</span>
                                            <span className="font-numeric">
                                                {objective.current} / {objective.target}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel material="matte" title="Easy wins">
                        {cards.achievements.closest.length === 0 ? (
                            <p className="text-sm text-[var(--ink-low)]">
                                Nothing is close to finishing right now.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {cards.achievements.closest.slice(0, 5).map((win) => (
                                    <li key={win.id} className="flex items-start gap-2.5">
                                        {win.icon ? (
                                            <GameIcon
                                                src={win.icon}
                                                alt=""
                                                size="md"
                                                tone={DOMAIN_TONE.achievements}
                                            />
                                        ) : (
                                            <Zap
                                                size={14}
                                                className="mt-0.5 shrink-0 text-[var(--ink-faint)]"
                                                aria-hidden
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="truncate text-sm text-[var(--ink-hi)]">
                                                    {win.name ?? `#${win.id}`}
                                                </span>
                                                <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                                    {win.current}/{win.max}
                                                </span>
                                            </div>
                                            {/*
                                             * What is left, in the game's words,
                                             * ahead of the achievement's blanket
                                             * requirement. "Morwood Wilds" is a
                                             * place to go; "Explore all areas in
                                             * Auric Basin" is the thing they
                                             * already know they are doing.
                                             */}
                                            {win.steps_remaining.length > 0 ? (
                                                <p className="truncate text-[11px] text-[var(--ink-faint)]">
                                                    {win.steps_remaining.slice(0, 2).join(" · ")}
                                                    {win.steps_remaining.length > 2 &&
                                                        ` · +${win.steps_remaining.length - 2}`}
                                                </p>
                                            ) : (
                                                win.requirement && (
                                                    <p className="truncate text-[11px] text-[var(--ink-faint)]">
                                                        {win.requirement}
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel material="matte" title="Since you connected">
                        {history.events.length === 0 ? (
                            <p className="text-sm text-[var(--ink-low)]">
                                Nothing has changed between reads yet.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {history.events.slice(0, 6).map((event, i) => (
                                    <li key={`${event.type}-${event.id}-${i}`} className="flex gap-2 text-sm">
                                        <Check size={14} className="mt-0.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
                                        <span className="text-[var(--ink-mid)]">
                                            {event.name ?? event.type.replace(/_/g, " ")}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/*
                         * This date has to be shown. The game's API reports raid
                         * clears only for the current week and has no lifetime
                         * view anywhere, so nothing before the day this account
                         * connected exists in any record and never will.
                         */}
                        {history.tracked_since && (
                            <p className="mt-3 border-t pt-3 text-[11px] text-[var(--ink-faint)]" style={{ borderColor: "var(--line)" }}>
                                We have been watching since{" "}
                                {new Date(history.tracked_since).toLocaleDateString()}. Guild Wars 2 keeps no
                                history of its own, so nothing before that can be recovered.
                            </p>
                        )}
                    </Panel>

                    <div className="flex items-center justify-between gap-3 text-xs text-[var(--ink-faint)]">
                        <span>
                            Read{" "}
                            {account.observed_at
                                ? new Date(account.observed_at).toLocaleString()
                                : "never"}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={sync}
                            isLoading={syncing || busy}
                            icon={<RefreshCw size={13} />}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IntentBar({
    intent,
    onChange,
    onToggleAvoid,
}: {
    intent: Gw2Intent;
    onChange: (next: Gw2Intent) => void;
    onToggleAvoid: (domain: string) => void;
}) {
    const [goals, setGoals] = useState<Gw2GoalOption[]>([]);

    useEffect(() => {
        void getGoals().then(setGoals).catch(() => setGoals([]));
    }, []);

    return (
        <div className="space-y-3 border-b pb-4" style={{ borderColor: "var(--line)" }}>
        {goals.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                    Working towards
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {goals.map((goal) => {
                        const on = intent.goal === goal.slug;

                        return (
                            <button
                                key={goal.slug}
                                type="button"
                                // Picking the same one again clears it. A goal
                                // is a hint, and a hint you cannot take back is
                                // a setting.
                                onClick={() => onChange({ ...intent, goal: on ? null : goal.slug })}
                                aria-pressed={on}
                                title={goal.summary ?? undefined}
                                className="rounded-[var(--radius-inner)] border px-2.5 py-1 text-xs transition-colors"
                                style={{
                                    borderColor: on
                                        ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                                        : "var(--line-strong)",
                                    background: on ? "var(--accent-soft)" : "transparent",
                                    color: on ? "var(--ink-hi)" : "var(--ink-low)",
                                }}
                            >
                                {goal.title}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                <Compass size={12} aria-hidden />
                I have
            </span>

            <div className="flex gap-1.5">
                {TIMES.map((time) => (
                    <button
                        key={time.label}
                        type="button"
                        onClick={() => onChange({ ...intent, minutes: time.minutes })}
                        aria-pressed={(intent.minutes ?? null) === time.minutes}
                        className="rounded-[var(--radius-inner)] border px-2.5 py-1 text-xs transition-colors"
                        style={{
                            borderColor:
                                (intent.minutes ?? null) === time.minutes
                                    ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                                    : "var(--line-strong)",
                            background:
                                (intent.minutes ?? null) === time.minutes ? "var(--accent-soft)" : "transparent",
                            color:
                                (intent.minutes ?? null) === time.minutes
                                    ? "var(--ink-hi)"
                                    : "var(--ink-low)",
                        }}
                    >
                        {time.label}
                    </button>
                ))}
            </div>

            <span className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">Not tonight</span>

            <div className="flex flex-wrap gap-1.5">
                {AVOIDABLE.map((option) => {
                    const off = (intent.avoid ?? []).includes(option.domain);

                    return (
                        <button
                            key={option.domain}
                            type="button"
                            onClick={() => onToggleAvoid(option.domain)}
                            aria-pressed={off}
                            className="rounded-[var(--radius-inner)] border px-2.5 py-1 text-xs transition-colors"
                            style={{
                                borderColor: "var(--line-strong)",
                                background: off ? "var(--fill-2)" : "transparent",
                                color: off ? "var(--ink-faint)" : "var(--ink-low)",
                                textDecoration: off ? "line-through" : "none",
                            }}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
        </div>
    );
}

function GearPanel({ gear }: { gear: NonNullable<Gw2Dashboard["cards"]["gear"]> }) {
    return (
        <Panel
            material="matte"
            title={`${gear.character} — equipment`}
            meta={
                <span className="text-xs text-[var(--ink-faint)]">
                    {gear.ascended_weapons}/{gear.weapon_slots} weapons ascended
                </span>
            }
        >
            {/*
             * Twelve slots as twelve worn pieces rather than twelve words.
             *
             * The frame is the game's own rarity colour — a player reads pink
             * for ascended and orange for exotic faster than either word, and
             * "which three are behind" is the only question this panel exists
             * to answer.
             */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-3">
                {Object.entries(gear.slots).map(([slot, rarity]) => {
                    const done = rarity === "Ascended" || rarity === "Legendary";
                    const item = gear.items?.[slot];

                    return (
                        <div key={slot} className="flex items-center gap-2.5">
                            <GameIcon
                                src={item?.icon}
                                alt=""
                                size="md"
                                rarity={rarity}
                                dim={done}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs text-[var(--ink-low)]">{slotLabel(slot)}</div>
                                <div
                                    className="truncate text-xs"
                                    style={{ color: done ? "var(--ink-mid)" : RARITY_COLOUR[rarity] }}
                                    title={item?.name}
                                >
                                    {item?.name ?? rarity}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {gear.empty.length > 0 && (
                <p className="mt-3 text-xs text-[var(--accent-ink)]">
                    Nothing equipped in: {gear.empty.map(slotLabel).join(", ")}
                </p>
            )}

            {gear.crafting.length === 0 && (
                <p className="mt-3 text-xs text-[var(--ink-low)]">
                    No crafting discipline is active on this character — ascended armour and weapons are
                    crafted.
                </p>
            )}

            {gear.crafting.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {gear.crafting.map((discipline) => (
                        <Chip key={discipline} variant="neutral" size="sm">
                            {discipline}
                        </Chip>
                    ))}
                </div>
            )}
        </Panel>
    );
}
