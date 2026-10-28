"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Clock, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import DomainGlyph from "@/components/gw2/DomainGlyph";
import { ActionLink, Gw2Panel } from "@/components/gw2/Gw2Ui";
import { DOMAIN_TONE, domainTone } from "@/lib/gw2domain";
import { getTonight, type Gw2Tonight, type NearlyDone } from "@/lib/gw2";

/**
 * The dashboard's right-hand column: the two panels mockup 1 gives it.
 *
 * It used to hold six — the vault, its season, the daily checklist, the history
 * since connecting, the connection, and these easy wins — which is a column a
 * reader scrolls past rather than reads. The vault, season and checklist went to
 * Tonight, where what resets tonight belongs; the history and the connection
 * went to the account page.
 */

/**
 * The first hour of Tonight's plan, as a teaser for the whole page.
 *
 * Its own request: the plan is built for a time budget, and the dashboard's
 * payload is built for none. Our own tables only — nothing here reaches the game.
 */
export function TonightTeaser() {
    // undefined while loading; null when there is no plan to show.
    const [tonight, setTonight] = useState<Gw2Tonight | null | undefined>(undefined);

    useEffect(() => {
        let live = true;

        getTonight(60)
            .then((payload) => {
                if (live) setTonight(payload);
            })
            .catch(() => {
                if (live) setTonight(null);
            });

        return () => {
            live = false;
        };
    }, []);

    if (tonight === null) return null;

    const steps = tonight?.plan.steps.slice(0, 4) ?? [];

    return (
        <Gw2Panel
            icon={<CalendarClock size={18} />}
            title="Tonight in Guild Wars 2"
            description="An hour, built from what your account still has open."
        >
            {tonight === undefined ? (
                <Skeleton className="h-44 w-full" />
            ) : (
                <>
                    <div
                        className="rounded-[var(--radius-card)] border p-3.5"
                        style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
                    >
                        <div className="flex items-center justify-between gap-2 text-[10.5px] uppercase tracking-[0.18em]">
                            <span className="text-[var(--accent-ink)]">1-hour session plan</span>
                            {tonight.plan.accounted_for > 0 && (
                                <span className="inline-flex items-center gap-1 normal-case tracking-normal text-[var(--ink-low)]">
                                    <Clock size={11} aria-hidden />
                                    {tonight.plan.accounted_for} min planned
                                </span>
                            )}
                        </div>

                        {steps.length === 0 ? (
                            <p className="mt-3 text-sm text-[var(--ink-low)]">Nothing fits an hour right now.</p>
                        ) : (
                            <ol className="mt-3 space-y-3">
                                {steps.map((step) => (
                                    <li key={step.key + step.subject} className="flex items-start gap-3">
                                        <span className="w-[58px] shrink-0 pt-1 font-numeric text-[11px] text-[var(--ink-low)]">
                                            {/* Ours, and said so under the list; silence where nobody has judged the rule. */}
                                            {step.starts_at !== null && step.costs !== null
                                                ? `${step.starts_at}–${step.starts_at + step.costs} min`
                                                : "—"}
                                        </span>
                                        <span
                                            aria-hidden
                                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                                            style={{
                                                color: domainTone(step.domain),
                                                borderColor: `color-mix(in srgb, ${domainTone(step.domain)} 45%, transparent)`,
                                            }}
                                        >
                                            <DomainGlyph domain={step.domain} size={14} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm text-[var(--ink-hi)]">{step.title}</p>
                                            <p className="line-clamp-1 text-[11px] text-[var(--ink-low)]">{step.body}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    <p className="mt-2.5 text-[11px] text-[var(--ink-faint)]">
                        Times are our estimates — the game reports how long nothing takes.
                    </p>

                    <ActionLink href="/gw2/tonight" className="mt-3">
                        View detailed plan
                    </ActionLink>
                </>
            )}
        </Gw2Panel>
    );
}

/**
 * Achievements closest to finishing, with what finishing pays.
 *
 * The reward column is the mockup's, filled from the catalogue: points from the
 * achievement's own tiers, and a mastery point where its rewards name a region.
 * Nothing where neither is known, rather than a "+0".
 */
export function EasyWins({ wins, oneStepAway }: { wins: NearlyDone[]; oneStepAway: number }) {
    const tone = DOMAIN_TONE.achievements;
    const shown = wins.slice(0, 4);

    return (
        <Gw2Panel
            icon={<Zap size={18} />}
            tone={tone}
            title="Easy wins"
            description={
                oneStepAway > 0
                    ? `${oneStepAway} ${oneStepAway === 1 ? "achievement is" : "achievements are"} a single step from done.`
                    : "The achievements closest to finishing."
            }
        >
            {shown.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">Nothing is close to finishing right now.</p>
            ) : (
                <ul className="space-y-2">
                    {shown.map((win) => (
                        <li
                            key={win.id}
                            className="flex items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5"
                            style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
                        >
                            {win.icon ? (
                                <GameIcon src={win.icon} alt="" size="md" tone={tone} />
                            ) : (
                                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: tone }}>
                                    <Zap size={16} />
                                </span>
                            )}

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-sm text-[var(--ink-hi)]">{win.name ?? `#${win.id}`}</span>
                                    <WikiLink wiki={win.wiki} name={win.name} compact />
                                </div>
                                {/*
                                 * What is left, in the game's words, ahead of the
                                 * blanket requirement. "Morwood Wilds" is a place
                                 * to go; "Explore all areas in Auric Basin" is the
                                 * thing they already know they are doing.
                                 */}
                                <p className="truncate text-[11px] text-[var(--ink-faint)]">
                                    {win.steps_remaining[0] ?? win.requirement ?? ""}
                                </p>
                            </div>

                            <div className="shrink-0 text-right">
                                {win.points ? (
                                    <div className="font-numeric text-xs" style={{ color: tone }}>
                                        +{win.points} AP
                                    </div>
                                ) : null}
                                {win.mastery_region && (
                                    <div className="text-[11px]" style={{ color: DOMAIN_TONE.masteries }} title={win.mastery_region}>
                                        +1 mastery point
                                    </div>
                                )}
                                <div className="font-numeric text-[11px] text-[var(--ink-low)]">
                                    {win.current}/{win.max}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Gw2Panel>
    );
}
