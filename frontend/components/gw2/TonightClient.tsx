"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Meter from "@/components/ui/Meter";
import { Skeleton } from "@/components/ui/Skeleton";
import { CONFIDENCE_LABEL, getTonight, type Gw2Tonight, type SessionStep } from "@/lib/gw2";

/**
 * An evening, built out of advice that already holds.
 *
 * Nothing new is invented on this page. The advisor decides what is worth doing
 * and how sure it is; this orders a subset of it to fit the time somebody says
 * they have.
 *
 * The mockup draws a schedule — 0–10 the vault, 10–20 a fractal — and those
 * minutes are an **editorial estimate**, because the game reports the duration
 * of nothing and people play at different speeds. So they are ranges, they are
 * labelled as ours, and a rule nobody has judged shows no clock at all rather
 * than a default. The header says how much of the stated hour the estimates
 * actually cover, which is a truer thing to show than a full timeline.
 */
const TIMES = [
    { minutes: 30, label: "30 minutes" },
    { minutes: 60, label: "1 hour" },
    { minutes: 120, label: "2 hours" },
    { minutes: null, label: "Long session" },
];

export default function TonightClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [minutes, setMinutes] = useState<number | null>(60);
    const [data, setData] = useState<Gw2Tonight | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");

    const load = useCallback(async (budget: number | null) => {
        try {
            const payload = await getTonight(budget);

            setData(payload);
            setState(payload ? "ready" : "none");
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            setState(status === 404 ? "none" : "error");
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        void load(minutes);
    }, [authLoading, user, minutes, load]);

    if (!authLoading && !user) {
        return <ConnectFirst />;
    }

    if (authLoading || state === "loading") {
        return <Skeleton className="h-96 w-full" />;
    }

    if (state === "error") {
        return (
            <Panel material="matte">
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">
                        We could not build a plan. This is a problem reaching our own server.
                    </p>
                    <Button variant="secondary" onClick={() => void load(minutes)}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !data) {
        return <ConnectFirst />;
    }

    return (
        <div className="space-y-6">
            <Panel material="lit" crown title="How much time do you have?">
                <div className="flex flex-wrap gap-2">
                    {TIMES.map((time) => {
                        const on = minutes === time.minutes;

                        return (
                            <button
                                key={time.label}
                                type="button"
                                onClick={() => setMinutes(time.minutes)}
                                aria-pressed={on}
                                className="rounded-[var(--radius-card)] border px-4 py-2 text-sm transition-colors"
                                style={{
                                    borderColor: on
                                        ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                                        : "var(--line-strong)",
                                    background: on ? "var(--accent-soft)" : "transparent",
                                    color: on ? "var(--ink-hi)" : "var(--ink-low)",
                                }}
                            >
                                {time.label}
                            </button>
                        );
                    })}
                </div>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                    <Panel
                        material="matte"
                        title={minutes ? `Your ${minutes}-minute session` : "Your session"}
                        meta={
                            data.plan.unaccounted !== null && data.plan.unaccounted > 0 ? (
                                <span className="text-xs text-[var(--ink-faint)]">
                                    {data.plan.accounted_for} min planned
                                </span>
                            ) : undefined
                        }
                    >
                        {data.plan.steps.length === 0 ? (
                            <p className="py-6 text-center text-sm text-[var(--ink-low)]">
                                Nothing fits that time right now. Try a longer session.
                            </p>
                        ) : (
                            <ol className="space-y-0">
                                {data.plan.steps.map((step, i) => (
                                    <Step key={step.key + step.subject} step={step} last={i === data.plan.steps.length - 1} />
                                ))}
                            </ol>
                        )}

                        {/*
                         * Said in the interface, not just in a comment. These
                         * numbers are ours; the game publishes no durations.
                         */}
                        <p className="mt-4 border-t pt-3 text-[11px] text-[var(--ink-faint)]" style={{ borderColor: "var(--line)" }}>
                            Times are our estimates — the game does not report how long anything takes.
                            {data.plan.unaccounted !== null && data.plan.unaccounted > 0 && (
                                <>
                                    {" "}
                                    About {data.plan.unaccounted} minutes of your session are unplanned, which
                                    is room for whatever you feel like.
                                </>
                            )}
                        </p>
                    </Panel>

                    {data.plan.if_you_have_longer.length > 0 && (
                        <Panel material="matte" title="If you have longer">
                            <ul className="space-y-3">
                                {data.plan.if_you_have_longer.map((step) => (
                                    <li key={step.key + step.subject} className="flex items-start gap-3">
                                        <Clock size={14} className="mt-1 shrink-0 text-[var(--ink-faint)]" aria-hidden />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-[var(--ink-hi)]">{step.title}</p>
                                            <p className="text-xs text-[var(--ink-low)]">{step.body}</p>
                                        </div>
                                        {step.minutes_low && (
                                            <span className="shrink-0 font-numeric text-[11px] text-[var(--ink-faint)]">
                                                ≈{step.minutes_low}–{step.minutes_high} min
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}
                </div>

                <div className="space-y-5">
                    <Panel material="instrument" title="What this is moving">
                        {data.priorities.length === 0 ? (
                            <p className="text-sm text-[var(--ink-low)]">
                                Nothing is outstanding right now.
                            </p>
                        ) : (
                            <ul className="space-y-3.5">
                                {data.priorities.map((priority) => (
                                    <li key={priority.key} className="space-y-1.5">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="truncate text-sm text-[var(--ink-hi)]">
                                                {priority.label}
                                            </span>
                                            <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                                {priority.current} / {priority.target}
                                            </span>
                                        </div>
                                        <Meter value={priority.current} max={priority.target} size="sm" />
                                        {priority.note && (
                                            <p className="text-[11px] text-[var(--accent-ink)]">{priority.note}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    {/*
                     * Only when somebody has entered and verified the times. The
                     * game has no schedule endpoint, so an empty panel is the
                     * better failure than a wrong one — a bad spawn time sends a
                     * player to an empty map.
                     */}
                    {data.events.length > 0 && (
                        <Panel material="matte" title="Happening soon">
                            <ul className="space-y-3">
                                {data.events.map((event) => (
                                    <li key={event.slug} className="flex items-start gap-2.5">
                                        <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="truncate text-sm text-[var(--ink-hi)]">
                                                    {event.name}
                                                </span>
                                                <span className="shrink-0 font-numeric text-[11px] text-[var(--ink-low)]">
                                                    {event.live_now ? "now" : `in ${event.minutes_away} min`}
                                                </span>
                                            </div>
                                            {event.region && (
                                                <p className="truncate text-[11px] text-[var(--ink-faint)]">
                                                    {event.region}
                                                    {event.waypoint ? ` · ${event.waypoint}` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}
                </div>
            </div>
        </div>
    );
}

function Step({ step, last }: { step: SessionStep; last: boolean }) {
    return (
        <li className="relative flex gap-4 pb-5 last:pb-0">
            {!last && (
                <span
                    className="absolute left-[5px] top-4 h-full w-px"
                    style={{ background: "var(--line-strong)" }}
                    aria-hidden
                />
            )}

            <span
                className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: "var(--accent)" }}
                aria-hidden
            />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-numeric text-[11px] text-[var(--ink-faint)]">
                        {/*
                         * No clock where the rule carries no estimate. Writing
                         * "0–10 min" there would be inventing the one number
                         * this page is careful about.
                         */}
                        {step.starts_at !== null && step.costs !== null
                            ? `${step.starts_at}–${step.starts_at + step.costs} min`
                            : "no estimate"}
                    </span>
                    <span className="text-sm font-medium text-[var(--ink-hi)]">{step.title}</span>
                </div>

                <p className="mt-1 text-sm text-[var(--ink-mid)]">{step.body}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Chip variant="neutral" size="sm">
                        {CONFIDENCE_LABEL[step.confidence]}
                    </Chip>
                    {step.minutes_low && (
                        <span className="font-numeric text-[11px] text-[var(--ink-faint)]">
                            ≈{step.minutes_low}–{step.minutes_high} min
                        </span>
                    )}
                </div>

                {step.blockers.map((blocker) => (
                    <p key={blocker} className="mt-1.5 flex gap-1.5 text-xs text-[var(--ink-low)]">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
                        {blocker}
                    </p>
                ))}
            </div>
        </li>
    );
}

function ConnectFirst() {
    return (
        <Panel material="lit" crown title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    A session plan is built from what your own account still has outstanding.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Panel>
    );
}
