"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import ChatCode from "@/components/gw2/ChatCode";
import SeasonPanel from "@/components/gw2/SeasonPanel";
import TodayPanel from "@/components/gw2/TodayPanel";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { DOMAIN_ART, DOMAIN_TONE, regionTone } from "@/lib/gw2domain";
import {
    CONFIDENCE_LABEL,
    getTonight,
    type Gw2Reward,
    type Gw2Tonight,
    type Priority,
    type ScheduledEvent,
    type SessionStep,
} from "@/lib/gw2";

/**
 * An evening, built out of advice that already holds — mockup 4.
 *
 * Nothing new is invented on this page. The advisor decides what is worth doing
 * and how sure it is; this orders a subset of it to fit the time somebody says
 * they have, weighed for their pinned goal and without what they said is not
 * for tonight.
 *
 * The mockup draws a schedule — 0–10 the vault, 10–20 a fractal — and those
 * minutes are an **editorial estimate**, because the game reports the duration
 * of nothing and people play at different speeds. So they are ranges, they are
 * labelled as ours, and a rule nobody has judged shows no clock at all rather
 * than a default. The header says how much of the stated hour the estimates
 * actually cover, which is a truer thing to show than a full timeline.
 *
 * "Potential rewards tonight" is the sum of what the planned steps say they pay
 * — acclaim, achievement points, mastery points, and the tiers, slots and mounts
 * by name. The mockup's gold estimate is not there: no step knows what it pays
 * in gold.
 */
const TIMES = [
    { minutes: 30, label: "30 minutes" },
    { minutes: 60, label: "1 hour" },
    { minutes: 120, label: "2 hours" },
    { minutes: null, label: "Long session" },
];

const AVOIDABLE = [
    { domain: "vault", label: "Wizard's Vault" },
    { domain: "achievements", label: "Achievements" },
    { domain: "masteries", label: "Masteries" },
    { domain: "gear", label: "Gear" },
    { domain: "fractals", label: "Fractals" },
];

/** The neutral badge every tag and estimate on this page wears. */
const TAG = "inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--fill-1)] px-2 py-0.5 text-[11px] text-[var(--ink-mid)]";

export default function TonightClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [minutes, setMinutes] = useState<number | null>(60);
    const [avoid, setAvoid] = useState<string[]>([]);
    const [data, setData] = useState<Gw2Tonight | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async (budget: number | null, leaveOut: string[]) => {
        setBusy(true);

        try {
            const payload = await getTonight(budget, leaveOut);

            setData(payload);
            setState(payload ? "ready" : "none");
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            setState(status === 404 ? "none" : "error");
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        void load(minutes, avoid);
    }, [authLoading, user, minutes, avoid, load]);

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
                    <Button variant="secondary" onClick={() => void load(minutes, avoid)}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !data) {
        return <ConnectFirst />;
    }

    const rewards = data.plan.rewards ?? [];

    return (
        <div className="space-y-6">
            <TimePanel
                minutes={minutes}
                onMinutes={setMinutes}
                avoid={avoid}
                onToggleAvoid={(domain) =>
                    setAvoid((current) =>
                        current.includes(domain) ? current.filter((d) => d !== domain) : [...current, domain]
                    )
                }
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className={`min-w-0 space-y-8 transition-opacity ${busy ? "opacity-60" : ""}`}>
                    <section className="space-y-4">
                        <SectionHeader
                            title={minutes ? `Your ${minutes >= 60 ? `${minutes / 60}-hour` : `${minutes}-minute`} session plan` : "Your session plan"}
                            description="What your account still has open, ordered to fit the time — weighed for your pinned goal."
                            meta={
                                data.plan.unaccounted !== null && data.plan.accounted_for > 0 ? (
                                    <span className="text-xs text-[var(--ink-low)]">{data.plan.accounted_for} min planned</span>
                                ) : undefined
                            }
                        />

                        {data.plan.steps.length === 0 ? (
                            <p className="rounded-[var(--radius-panel)] border px-5 py-6 text-center text-sm text-[var(--ink-low)]" style={{ borderColor: "var(--line)" }}>
                                Nothing fits that time right now. Try a longer session, or leave less out.
                            </p>
                        ) : (
                            <ol>
                                {data.plan.steps.map((step, i) => (
                                    <Step key={step.key + step.subject} step={step} last={i === data.plan.steps.length - 1} />
                                ))}
                            </ol>
                        )}

                        {/*
                         * Said in the interface, not just in a comment. These
                         * numbers are ours; the game publishes no durations.
                         */}
                        <p className="text-[11px] text-[var(--ink-faint)]">
                            Times are our estimates — the game does not report how long anything takes.
                            {data.plan.unaccounted !== null && data.plan.unaccounted > 0 && (
                                <>
                                    {" "}
                                    About {data.plan.unaccounted} minutes of your session are unplanned, which is room
                                    for whatever you feel like.
                                </>
                            )}
                        </p>
                    </section>

                    {data.plan.if_you_have_longer.length > 0 && (
                        <section className="space-y-4">
                            <SectionHeader
                                title="If you have extra time"
                                description="The same advice, below the line your time drew."
                            />
                            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                                {data.plan.if_you_have_longer.map((step) => (
                                    <ExtraCard key={step.key + step.subject} step={step} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="space-y-5">
                    <PrioritiesPanel priorities={data.priorities} />

                    {/*
                     * Only when somebody has entered and verified the times. The
                     * game has no schedule endpoint, so an empty panel is the
                     * better failure than a wrong one — a bad spawn time sends a
                     * player to an empty map.
                     */}
                    {data.events.length > 0 && <EventsPanel events={data.events} />}

                    {rewards.length > 0 && <RewardsPanel rewards={rewards} />}

                    <VaultPanel vault={data.vault} />

                    {data.season && <SeasonPanel season={data.season} />}

                    {data.today && <TodayPanel today={data.today} />}
                </div>
            </div>
        </div>
    );
}

function TimePanel({
    minutes,
    onMinutes,
    avoid,
    onToggleAvoid,
}: {
    minutes: number | null;
    onMinutes: (minutes: number | null) => void;
    avoid: string[];
    onToggleAvoid: (domain: string) => void;
}) {
    return (
        <section
            className="rounded-[var(--radius-panel)] border p-5"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="font-display text-xl font-semibold text-[var(--ink-hi)]">How much time do you have?</h2>
                    <p className="mt-1 text-sm text-[var(--ink-low)]">
                        We build the plan from your account and what is open right now.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TIMES.map((time) => {
                        const on = minutes === time.minutes;

                        return (
                            <button
                                key={time.label}
                                type="button"
                                onClick={() => onMinutes(time.minutes)}
                                aria-pressed={on}
                                className="h-11 min-w-[120px] rounded-[var(--radius-card)] border px-4 text-sm transition-colors hover:bg-[var(--fill-2)]"
                                style={{
                                    borderColor: on ? "var(--accent)" : "var(--line-strong)",
                                    background: on ? "var(--fill-2)" : "var(--fill-1)",
                                    color: on ? "var(--ink-hi)" : "var(--ink-mid)",
                                }}
                            >
                                {time.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/*
             * The mockup's "Adjust plan", made into what it can honestly be: the
             * player says what they are not in the mood for, and the plan is
             * weighed again without it.
             */}
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                <span className="text-xs font-medium text-[var(--ink-low)]">Not tonight</span>
                {AVOIDABLE.map((option) => {
                    const off = avoid.includes(option.domain);

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
        </section>
    );
}

/**
 * Where a step sits in the session. Three states, and they are genuinely
 * different: a position when the player gave a budget; nothing when they did
 * not (there is an estimate, just no session to place it in); and "no
 * estimate" only when the rule really carries none, because writing "0–10 min"
 * there would invent the one number this page is careful about.
 */
function slot(step: SessionStep): string {
    if (step.starts_at !== null && step.costs !== null) return `${step.starts_at}–${step.starts_at + step.costs} min`;

    return step.minutes_low === null ? "no estimate" : "";
}

function Step({ step, last }: { step: SessionStep; last: boolean }) {
    const scene = DOMAIN_ART[step.domain] ?? step.background ?? null;

    return (
        <li className="relative grid grid-cols-[64px_minmax(0,1fr)] gap-3 pb-4 last:pb-0 sm:grid-cols-[84px_minmax(0,1fr)]">
            <div className="relative">
                {!last && (
                    <span aria-hidden className="absolute bottom-[-16px] left-[6px] top-5 w-px" style={{ background: "var(--line-strong)" }} />
                )}
                <div className="flex items-start gap-2 pt-1">
                    <span
                        aria-hidden
                        className="relative mt-[3px] h-3 w-3 shrink-0 rounded-full border-2"
                        style={{ borderColor: "var(--ink-faint)", background: "var(--surface-0)" }}
                    />
                    <span className="font-numeric text-[11px] leading-tight text-[var(--ink-low)]">{slot(step)}</span>
                </div>
            </div>

            <article
                className="relative flex gap-4 overflow-hidden rounded-[var(--radius-panel)] border p-3.5"
                style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
            >
                {/*
                 * The mastery track's render behind the reasoning column. The
                 * fade is a scrim, not decoration: the text on wide screens sits
                 * on top of the picture.
                 */}
                {scene && (
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
                        style={{
                            backgroundImage: `linear-gradient(to right, var(--surface-1), transparent), url(${scene})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.35,
                        }}
                    />
                )}

                {step.icon && (
                    <span className="relative shrink-0">
                        <GameIcon src={step.icon} alt="" size="lg" />
                    </span>
                )}

                <div className="relative min-w-0 flex-1 space-y-1.5 lg:max-w-[58%]">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="font-display text-base font-semibold leading-snug text-[var(--ink-hi)]">{step.title}</h3>
                        <WikiLink wiki={step.wiki} name={step.title} compact />
                        {step.minutes_low && (
                            <span className={`${TAG} font-numeric`}>
                                ≈{step.minutes_low}–{step.minutes_high} min
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-medium text-[var(--ink-low)] first-letter:uppercase">
                        {step.domain} · {CONFIDENCE_LABEL[step.confidence]}
                    </p>
                    <RewardTags rewards={step.rewards ?? []} />
                    <p className="text-sm leading-relaxed text-[var(--ink-mid)] lg:hidden">{step.body}</p>
                    {step.blockers.map((blocker) => (
                        <p key={blocker} className="flex gap-1.5 text-xs text-[var(--ink-low)]">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
                            {blocker}
                        </p>
                    ))}
                </div>

                {/* The mockup's reasoning column, on screens with room for it. */}
                <p className="relative hidden flex-1 self-center text-sm leading-relaxed text-[var(--ink-mid)] lg:block">
                    {step.body}
                </p>
            </article>
        </li>
    );
}

function ExtraCard({ step }: { step: SessionStep }) {
    return (
        <article
            className="flex flex-col gap-3 rounded-[var(--radius-panel)] border p-4"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            <div className="flex items-start gap-3">
                {step.icon && <GameIcon src={step.icon} alt="" size="md" />}
                <div className="min-w-0">
                    <div className="flex items-start gap-1">
                        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--ink-hi)]">{step.title}</h3>
                        <WikiLink wiki={step.wiki} name={step.title} compact className="mt-0.5" />
                    </div>
                    {step.minutes_low && (
                        <p className="mt-0.5 font-numeric text-[11px] text-[var(--ink-low)]">
                            ≈{step.minutes_low}–{step.minutes_high} min
                        </p>
                    )}
                </div>
            </div>
            <p className="line-clamp-3 text-xs text-[var(--ink-low)]">{step.body}</p>
            <RewardTags rewards={step.rewards ?? []} />
        </article>
    );
}

/** How each kind of reward is said, one at a time on a step and summed in the panel. */
const REWARD: Record<string, { one: (r: Gw2Reward) => string; total: string }> = {
    acclaim: { one: (r) => `+${r.amount} acclaim`, total: "Astral Acclaim" },
    ap: { one: (r) => `+${r.amount} AP`, total: "Achievement points" },
    mastery_point: {
        one: (r) => (r.amount === 1 ? "+1 mastery point" : `+${r.amount} mastery points`),
        total: "Mastery points",
    },
    mastery_tier: { one: (r) => r.name ?? "Mastery tier", total: "Mastery tiers" },
    ascended: { one: (r) => `Ascended ${r.name ?? "slot"}`, total: "Ascended slots" },
    mount: { one: (r) => r.name ?? "Mount", total: "Mounts" },
};

function RewardTags({ rewards }: { rewards: Gw2Reward[] }) {
    if (rewards.length === 0) return null;

    return (
        <ul className="flex flex-wrap gap-1.5">
            {rewards.map((reward, i) => {
                const meta = REWARD[reward.kind];

                if (!meta) return null;

                return (
                    <li key={`${reward.kind}-${i}`} className={TAG}>
                        {meta.one(reward)}
                    </li>
                );
            })}
        </ul>
    );
}

function RewardsPanel({ rewards }: { rewards: NonNullable<Gw2Tonight["plan"]["rewards"]> }) {
    return (
        <Gw2Panel
            title="Potential rewards tonight"
            description="What the planned steps pay, if you do them. Gold is not counted — no step knows it."
        >
            <ul className="grid grid-cols-2 gap-2">
                {rewards.map((reward) => {
                    const meta = REWARD[reward.kind];

                    if (!meta) return null;

                    return (
                        <li
                            key={reward.kind}
                            className="flex flex-col gap-1 rounded-[var(--radius-card)] border p-3"
                            style={{ borderColor: "var(--line)", background: "var(--fill-1)" }}
                        >
                            {reward.amount !== undefined ? (
                                <span className="font-numeric text-xl font-semibold leading-none text-[var(--ink-hi)]">+{reward.amount}</span>
                            ) : (
                                <span className="line-clamp-2 text-xs text-[var(--ink-hi)]">{(reward.names ?? []).join(", ")}</span>
                            )}
                            <span className="text-[11px] text-[var(--ink-low)]">{meta.total}</span>
                        </li>
                    );
                })}
            </ul>
        </Gw2Panel>
    );
}

/** A priority's bar colour, from its key: the same domains the cards use. */
function priorityTone(key: string): string {
    if (key === "agony") return DOMAIN_TONE.fractals;
    if (key === "ascended") return DOMAIN_TONE.gear;
    if (key === "vault_weekly") return DOMAIN_TONE.vault;
    if (key.startsWith("mastery:")) return regionTone(key.slice("mastery:".length));

    return "var(--accent)";
}

function PrioritiesPanel({ priorities }: { priorities: Priority[] }) {
    return (
        <Gw2Panel title="Active priorities" description="What tonight moves, measured from your account.">
            {priorities.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">Nothing is outstanding right now.</p>
            ) : (
                <ul className="space-y-3.5">
                    {priorities.map((priority) => (
                        <li key={priority.key} className="space-y-1.5">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm text-[var(--ink-hi)]">{priority.label}</span>
                                <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                    {priority.current} / {priority.target}
                                </span>
                            </div>
                            <Meter value={priority.current} max={priority.target} size="sm" tone={priorityTone(priority.key)} />
                            {priority.note && <p className="text-[11px] text-[var(--ink-low)]">{priority.note}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </Gw2Panel>
    );
}

function EventsPanel({ events }: { events: ScheduledEvent[] }) {
    return (
        <Gw2Panel title="Current events" description="World bosses, from times checked in game.">
            <ul className="space-y-2">
                {events.map((event) => {
                    const status = event.live_now
                        ? { label: "Live now", color: "var(--accent-ink)" }
                        : event.minutes_away <= 15
                          ? { label: "Soon", color: "var(--warning)" }
                          : { label: "Upcoming", color: "var(--ink-low)" };

                    return (
                        <li
                            key={event.slug}
                            className="flex items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5"
                            style={{
                                borderColor: "var(--line)",
                                background: "var(--fill-1)",
                                opacity: event.killed_today ? 0.6 : 1,
                            }}
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-[var(--ink-hi)]">{event.name}</p>
                                <p className="truncate text-[11px] text-[var(--ink-low)]">
                                    {event.live_now
                                        ? "Up now"
                                        : event.minutes_away >= 60
                                          ? `In ${Math.floor(event.minutes_away / 60)} h ${event.minutes_away % 60} min`
                                          : `In ${event.minutes_away} min`}
                                    {/* From the account's own read: the one thing a timer site cannot say. */}
                                    {event.killed_today === true && " · done today"}
                                    {event.killed_today === false && " · not killed today"}
                                </p>
                                {event.region && (
                                    <p className="truncate text-[11px] text-[var(--ink-faint)]">
                                        {event.region}
                                        {event.waypoint ? ` · ${event.waypoint}` : ""}
                                    </p>
                                )}
                            </div>
                            {event.waypoint_chat_link && <ChatCode code={event.waypoint_chat_link} label={event.waypoint} />}
                            <span className={`${TAG} shrink-0 font-medium`} style={{ color: status.color }}>
                                {status.label}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </Gw2Panel>
    );
}

/**
 * What is open in the Wizard's Vault right now — moved here from the
 * dashboard's right-hand column in the redesign, because the vault resets with
 * the evening this page is about.
 *
 * The objectives arrive from the game with their own titles, targets and
 * acclaim, so nothing on this panel is estimated.
 */
function VaultPanel({ vault }: { vault: Gw2Tonight["vault"] }) {
    // Undefined only from a backend older than this page — the two halves
    // deploy a minute apart. Nothing is drawn rather than a false "not read".
    if (vault === undefined) return null;

    return (
        <Gw2Panel title="Open right now" description="Wizard's Vault">
            {!vault ? (
                // Absent is not empty, and absent has two causes: a key without
                // `progression` never read the vault, and a key with it has not
                // been read since the vault arrived. "Nothing open" would be
                // inventing either.
                <p className="text-sm text-[var(--ink-low)]">
                    We have not read your vault. It needs the <strong>progression</strong> permission on your key, and
                    arrives with the next read once it has it.
                </p>
            ) : vault.open.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">Everything is done for this period.</p>
            ) : (
                <ul className="space-y-3">
                    {vault.open.map((objective) => (
                        <li key={`${objective.period}-${objective.id}`} className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-sm leading-snug text-[var(--ink-hi)]">{objective.title}</span>
                                <span className="shrink-0 font-numeric text-xs text-[var(--ink-mid)]">+{objective.acclaim}</span>
                            </div>
                            <Meter value={objective.current} max={objective.target} size="sm" tone={DOMAIN_TONE.vault} />
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
        </Gw2Panel>
    );
}

function ConnectFirst() {
    return (
        <Gw2Panel title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    A session plan is built from what your own account still has outstanding.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Gw2Panel>
    );
}
