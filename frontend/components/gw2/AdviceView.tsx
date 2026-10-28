"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Compass, Pin, PinOff } from "lucide-react";
import RecommendationCard from "@/components/gw2/RecommendationCard";
import { CharacterBar, wornPieces } from "@/components/gw2/DashboardView";
import { SectionHeader } from "@/components/gw2/Gw2Ui";
import {
    getGoals,
    gw2Error,
    pinGoal,
    unpinGoal,
    type Gw2Dashboard,
    type Gw2GoalOption,
    type Gw2Intent,
    type Gw2Pin,
} from "@/lib/gw2";

/**
 * "What should I do next?" — the full answer, and the controls that shape it.
 *
 * Split off the dashboard in the redesign of 28 October 2026. The mockup's menu
 * has both entries, and the dashboard was carrying both jobs: an overview, and a
 * form for re-asking the question with a goal, a time budget and a list of
 * things to leave out. Here the question is the page — all six answers, the
 * three that lead and the three behind them, re-weighed as the controls change.
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

export default function AdviceView({
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
    const { advice } = dashboard;
    const pieces = wornPieces(dashboard.cards.gear);

    async function togglePin(slug: string, pinned: boolean) {
        try {
            if (pinned) {
                await unpinGoal(slug);

                // Unpinning the goal that is also the one asked for clears both;
                // otherwise the chip would stay lit by the request alone.
                if (intent.goal === slug) {
                    onIntentChange({ ...intent, goal: null });

                    return;
                }
            } else {
                await pinGoal(slug);
            }

            onRefresh();
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not save that just now."));
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
            <CharacterBar dashboard={dashboard} onChanged={onRefresh} />

            <section className="space-y-4">
                <SectionHeader
                    icon={<Compass size={18} />}
                    title="Recommended next steps"
                    description="Based on your account and the goal you pick. Every card says how sure we are."
                    meta={
                        <span className="text-xs text-[var(--ink-faint)]" aria-live="polite">
                            {busy ? "Weighing…" : `${advice.considered} weighed`}
                        </span>
                    }
                />

                <IntentBar
                    intent={intent}
                    pins={dashboard.pins ?? []}
                    goalInUse={dashboard.goal_in_use ?? null}
                    onChange={onIntentChange}
                    onToggleAvoid={toggleAvoid}
                    onTogglePin={togglePin}
                />

                <div className={busy ? "opacity-60 transition-opacity" : "transition-opacity"}>
                    {advice.headline.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[var(--ink-low)]">
                            {advice.considered === 0
                                ? "Nothing matched right now — which usually means your account is in good shape."
                                : "Everything we weighed was filtered out. Try relaxing the time limit."}
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            {advice.headline.map((recommendation, i) => (
                                <RecommendationCard
                                    key={recommendation.key + recommendation.subject}
                                    recommendation={recommendation}
                                    featured={i === 0}
                                    pieces={recommendation.domain === "gear" ? pieces : undefined}
                                />
                            ))}
                        </div>
                    )}

                    {advice.alternatives.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h3 className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">
                                Or instead
                            </h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                {advice.alternatives.map((recommendation) => (
                                    <RecommendationCard
                                        key={recommendation.key + recommendation.subject}
                                        recommendation={recommendation}
                                        pieces={recommendation.domain === "gear" ? pieces : undefined}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function IntentBar({
    intent,
    pins,
    goalInUse,
    onChange,
    onToggleAvoid,
    onTogglePin,
}: {
    intent: Gw2Intent;
    pins: Gw2Pin[];
    goalInUse: string | null;
    onChange: (next: Gw2Intent) => void;
    onToggleAvoid: (domain: string) => void;
    onTogglePin: (slug: string, pinned: boolean) => void;
}) {
    const [goals, setGoals] = useState<Gw2GoalOption[]>([]);

    useEffect(() => {
        void getGoals().then(setGoals).catch(() => setGoals([]));
    }, []);

    const pinned = new Set(pins.map((pin) => pin.slug));

    return (
        <div
            className="space-y-3 rounded-[var(--radius-panel)] border p-4"
            style={{ borderColor: "var(--line)", background: "var(--surface-1)" }}
        >
            {goals.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                            Working towards
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {goals.map((goal) => {
                                // Lit by what the answer was weighted for, which is
                                // the asked-for goal or, failing that, the top pin.
                                // Lit only by `intent` it showed nothing selected
                                // while a pin was quietly shaping the advice.
                                const on = goalInUse === goal.slug;
                                const isPinned = pinned.has(goal.slug);
                                const onlyByPin = on && intent.goal !== goal.slug;

                                return (
                                    <span
                                        key={goal.slug}
                                        className="inline-flex items-stretch overflow-hidden rounded-[var(--radius-inner)] border text-xs transition-colors"
                                        style={{
                                            borderColor: on
                                                ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                                                : "var(--line-strong)",
                                            background: on ? "var(--accent-soft)" : "transparent",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            /*
                                             * Picking the same one again clears it —
                                             * a goal is a hint, and a hint you cannot
                                             * take back is a setting. One lit only by
                                             * its pin has nothing to clear, so the
                                             * same click unpins it.
                                             */
                                            onClick={() =>
                                                onlyByPin
                                                    ? onTogglePin(goal.slug, true)
                                                    : onChange({ ...intent, goal: on ? null : goal.slug })
                                            }
                                            aria-pressed={on}
                                            title={
                                                onlyByPin
                                                    ? "Your pinned goal — click to unpin it"
                                                    : goal.summary ?? undefined
                                            }
                                            className="px-2.5 py-1"
                                            style={{ color: on ? "var(--ink-hi)" : "var(--ink-low)" }}
                                        >
                                            {goal.title}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onTogglePin(goal.slug, isPinned)}
                                            aria-pressed={isPinned}
                                            aria-label={isPinned ? `Unpin “${goal.title}”` : `Pin “${goal.title}”`}
                                            title={isPinned ? "Pinned — kept for next time" : "Pin it, so it is kept for next time"}
                                            className="border-l px-1.5 transition-colors hover:bg-[var(--fill-1)]"
                                            style={{
                                                borderColor: "var(--line)",
                                                color: isPinned ? "var(--accent-ink)" : "var(--ink-faint)",
                                            }}
                                        >
                                            {isPinned ? <Pin size={11} aria-hidden /> : <PinOff size={11} aria-hidden />}
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                    {pins.length > 0 && (
                        <p className="text-[11px] text-[var(--ink-faint)]">
                            Pinned goals are kept, and the newest one is used whenever you have not picked another —
                            on the dashboard too.
                        </p>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">I have</span>

                <div className="flex gap-1.5">
                    {TIMES.map((time) => {
                        const on = (intent.minutes ?? null) === time.minutes;

                        return (
                            <button
                                key={time.label}
                                type="button"
                                onClick={() => onChange({ ...intent, minutes: time.minutes })}
                                aria-pressed={on}
                                className="rounded-[var(--radius-inner)] border px-2.5 py-1 text-xs transition-colors"
                                style={{
                                    borderColor: on ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--line-strong)",
                                    background: on ? "var(--accent-soft)" : "transparent",
                                    color: on ? "var(--ink-hi)" : "var(--ink-low)",
                                }}
                            >
                                {time.label}
                            </button>
                        );
                    })}
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
