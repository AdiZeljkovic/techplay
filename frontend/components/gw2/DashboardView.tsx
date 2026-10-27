"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Check, Compass, Link2Off, Pin, PinOff, RefreshCw, UserRound, Zap } from "lucide-react";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Meter from "@/components/ui/Meter";
import Select from "@/components/ui/Select";
import StatCards from "@/components/gw2/StatCards";
import RecommendationCard from "@/components/gw2/RecommendationCard";
import GameIcon, { RARITY_COLOUR } from "@/components/gw2/GameIcon";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import {
    chooseCharacter,
    disconnect,
    getGoals,
    gw2Error,
    pinGoal,
    requestSync,
    slotLabel,
    unpinGoal,
    type Gw2Dashboard,
    type Gw2GoalOption,
    type Gw2Intent,
    type Gw2Pin,
} from "@/lib/gw2";

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

const LINKS = [
    { href: "/gw2/masteries", label: "All masteries" },
    { href: "/gw2/content", label: "Raids & bosses" },
    { href: "/gw2/story", label: "Story" },
    { href: "/gw2/tonight", label: "Tonight" },
    { href: "/gw2/planner", label: "Crafting planner" },
    // The public half, reachable from the private one. Nothing here linked
    // back to it, so a signed-in player never found the reference pages.
    { href: "/gw2/database", label: "Database" },
];

export default function DashboardView({
    dashboard,
    intent,
    onIntentChange,
    onRefresh,
    onDisconnected,
    busy,
}: {
    dashboard: Gw2Dashboard;
    intent: Gw2Intent;
    onIntentChange: (next: Gw2Intent) => void;
    onRefresh: () => void;
    onDisconnected: () => void;
    busy: boolean;
}) {
    const [syncing, setSyncing] = useState<"quick" | "full" | null>(null);
    const { account, cards, advice, since_last_sync: history, connection } = dashboard;

    async function sync(full: boolean) {
        setSyncing(full ? "full" : "quick");

        try {
            const { connection: after, message } = await requestSync(full);

            /*
             * A full read inside the hour is answered with the time of the last
             * one rather than queued, and only a queued read leaves the
             * connection pending. Saying so is the whole response — reloading
             * after it would only redraw what is already on screen.
             */
            if (after.sync_status !== "pending") {
                toast(message ?? "Your account was read recently.");

                return;
            }

            /*
             * The read is queued, not immediate — the game's rate limit belongs
             * to the whole site, so nothing here waits on ArenaNet. Give the
             * worker a moment, then reload. If it is not done, the next refresh
             * catches it.
             */
            await new Promise((resolve) => setTimeout(resolve, full ? 8000 : 4000));
            onRefresh();
        } catch (e: unknown) {
            // This used to be try/finally with no catch, so a 429 from the
            // route's own throttle was an unhandled rejection and no message.
            toast.error(gw2Error(e, "We could not ask for a read just now."));
        } finally {
            setSyncing(null);
        }
    }

    async function pickCharacter(name: string) {
        try {
            await chooseCharacter(name || null);
            onRefresh();
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not change the character just now."));
        }
    }

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

    async function disconnectAccount() {
        if (
            !confirm(
                "Disconnect your Guild Wars 2 account?\n\nThe key is deleted, and so is everything read with it — " +
                    "including the history since you connected, which the game does not keep and cannot give back."
            )
        ) {
            return;
        }

        try {
            await disconnect();
            toast.success("Disconnected. The key and everything read with it are gone.");
            onDisconnected();
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not disconnect just now."));
        }
    }

    function toggleAvoid(domain: string) {
        const avoid = intent.avoid ?? [];

        onIntentChange({
            ...intent,
            avoid: avoid.includes(domain) ? avoid.filter((d) => d !== domain) : [...avoid, domain],
        });
    }

    const missing = Object.entries(connection.missing_features ?? {});

    return (
        <div className="space-y-6">
            <CharacterBar dashboard={dashboard} onPick={pickCharacter} />

            <StatCards dashboard={dashboard} />

            {/* The places a card sends you when its number is the one you came
                to act on. Kept here rather than in the page shell so they do not
                appear beside the connect form, where none of them works. */}
            <nav className="flex flex-wrap gap-2">
                {LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-[var(--radius-inner)] border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--fill-1)]"
                        style={{ borderColor: "var(--line-strong)", color: "var(--ink-mid)" }}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                    <Panel
                        material="matte"
                        title="What to do next"
                        meta={
                            <span className="text-xs text-[var(--ink-faint)]" aria-live="polite">
                                {busy ? "Weighing…" : `${advice.considered} weighed`}
                            </span>
                        }
                    >
                        <div className="space-y-4">
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
                                    <div className="mt-4 space-y-3">
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
                            // Absent is not empty, and absent has two causes. A
                            // key without `progression` never read the vault; a
                            // key with it simply has not been read since the
                            // vault arrived. Saying "nothing open" would be
                            // inventing either.
                            <p className="text-sm text-[var(--ink-low)]">
                                {connection.permissions.includes("progression") ? (
                                    "We have not read your vault yet. It arrives with the next read."
                                ) : (
                                    <>
                                        Your key does not include the <strong>progression</strong> permission, so we
                                        cannot read your vault.
                                    </>
                                )}
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

                    {/*
                     * The connection itself: what was read and when, what the key
                     * does not share, and the two things the connect screen
                     * promises — reading again, and taking the key away. The
                     * promise "disconnecting deletes the key" had no button
                     * anywhere on the site until this panel.
                     */}
                    <Panel
                        material="matte"
                        title="Your connection"
                        meta={
                            <span className="truncate text-xs text-[var(--ink-faint)]">
                                {connection.account_name ?? account.name}
                            </span>
                        }
                    >
                        <div className="space-y-3 text-xs">
                            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[var(--ink-low)]">
                                <dt>Last read</dt>
                                <dd className="text-right text-[var(--ink-mid)]">
                                    {account.observed_at ? new Date(account.observed_at).toLocaleString() : "never"}
                                </dd>
                                <dt>Last full read</dt>
                                <dd className="text-right text-[var(--ink-mid)]">
                                    {connection.last_full_sync_at
                                        ? new Date(connection.last_full_sync_at).toLocaleString()
                                        : "never"}
                                </dd>
                                {connection.key_name && (
                                    <>
                                        <dt>Key</dt>
                                        <dd className="truncate text-right text-[var(--ink-mid)]">{connection.key_name}</dd>
                                    </>
                                )}
                            </dl>

                            {(connection.sync_status === "pending" || connection.sync_status === "syncing") && (
                                <p className="text-[var(--ink-mid)]">A read is on its way.</p>
                            )}

                            {connection.sync_status === "error" && connection.sync_error && (
                                <p role="status" className="text-[var(--accent-ink)]">
                                    {connection.sync_error}
                                </p>
                            )}

                            {missing.length > 0 && (
                                <div className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                                    <p className="text-[var(--ink-mid)]">Your key does not share:</p>
                                    <ul className="space-y-1 text-[var(--ink-low)]">
                                        {missing.map(([permission, feature]) => (
                                            <li key={permission}>
                                                <span className="font-numeric text-[var(--ink-mid)]">{permission}</span>
                                                {" — "}
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-[var(--ink-faint)]">
                                        A new key with these ticked lights them up.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void sync(false)}
                                    isLoading={syncing === "quick"}
                                    disabled={syncing !== null}
                                    icon={<RefreshCw size={13} />}
                                    title="Re-reads what changes within a day: the vault, raids, bosses and dungeons."
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void sync(true)}
                                    isLoading={syncing === "full"}
                                    disabled={syncing !== null}
                                    title="Reads everything again — characters, gear, story and inventory. Once an hour."
                                >
                                    Full read
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void disconnectAccount()}
                                    icon={<Link2Off size={13} />}
                                    className="ml-auto text-[var(--accent-ink)]"
                                >
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}

/**
 * Which character the cards are about.
 *
 * We rank by level and gear until told otherwise, which is a reasonable guess
 * and still a guess — a veteran with fifteen characters has a main, and nothing
 * in the API says which. One character needs no control, only its name.
 */
function CharacterBar({
    dashboard,
    onPick,
}: {
    dashboard: Gw2Dashboard;
    onPick: (name: string) => void;
}) {
    const current = dashboard.account.featured_character;
    const characters = dashboard.characters ?? [];

    if (!current) return null;

    const chosen = dashboard.featured_character ?? "";

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                <UserRound size={12} aria-hidden />
                Advice is about
            </span>

            {characters.length > 1 ? (
                <Select
                    value={chosen}
                    onChange={onPick}
                    ariaLabel="Character the advice is about"
                    className="h-9 min-w-[220px] px-3 text-[13px]"
                    options={[
                        {
                            value: "",
                            // Named, so the reader can see what our guess is
                            // before deciding whether to overrule it.
                            label: `Our pick — ${chosen ? "by level and gear" : current.name}`,
                        },
                        ...characters.map((c) => ({
                            value: c.name,
                            label: `${c.name} — ${[c.profession, `level ${c.level}`].filter(Boolean).join(", ")}`,
                        })),
                    ]}
                />
            ) : (
                <span className="text-[var(--ink-hi)]">{current.name}</span>
            )}
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
        <div className="space-y-3 border-b pb-4" style={{ borderColor: "var(--line)" }}>
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
                        Pinned goals are kept, and the newest one is used whenever you have not picked another.
                    </p>
                )}
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
