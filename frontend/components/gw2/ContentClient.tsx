"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import { Skeleton } from "@/components/ui/Skeleton";
import WikiLink from "@/components/gw2/WikiLink";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { Gw2Card, PageSummary, SummaryFact } from "@/components/gw2/Gw2PageParts";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { getContent, type Gw2Content, type RaidWing } from "@/lib/gw2";

/**
 * Raids, world bosses and dungeons — this period, and ever.
 *
 * Two columns that mean genuinely different things, which is the whole reason
 * this page is careful. **This week** comes from the game and is complete.
 * **Ever** comes from our own snapshots: the difference between two reads, which
 * begins on the day the account connected and can never reach further back,
 * because the game keeps no history of its own.
 *
 * That date is printed rather than assumed. Without it, an account connected
 * yesterday would look like somebody who has done nothing in nine years.
 *
 * What is deliberately absent: any claim that a player is "ready" for a raid.
 * Gear says nothing about whether somebody knows an encounter, and a tool that
 * infers the second from the first is setting people up to be kicked from a
 * group.
 *
 * Each wing is a card with its bosses as rows, and the daily half — world
 * bosses and dungeons — sits down the right beside the note on where each
 * number comes from. The raid colour is in the bars and nowhere else.
 */

const RAIDS = DOMAIN_TONE.raids;

export default function ContentClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Content | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    // Bumped by "Try again"; the read itself lives in the effect.
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (authLoading || !user) return;

        let cancelled = false;

        getContent()
            .then((payload) => {
                if (cancelled) return;
                setData(payload);
                setState(payload ? "ready" : "none");
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                const status = (e as { response?: { status?: number } }).response?.status;

                setState(status === 404 ? "none" : "error");
            });

        return () => {
            cancelled = true;
        };
    }, [authLoading, user, attempt]);

    function retry() {
        setState("loading");
        setAttempt((n) => n + 1);
    }

    if (!authLoading && !user) return <ConnectFirst />;
    if (authLoading || state === "loading") return <Skeleton className="h-96 w-full" />;

    if (state === "error") {
        return (
            <Panel material="matte">
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">
                        We could not load this. It is a problem reaching our own server.
                    </p>
                    <Button variant="secondary" onClick={retry}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !data) return <ConnectFirst />;

    const since = data.tracked_since ? new Date(data.tracked_since).toLocaleDateString() : null;

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
                <PageSummary
                    title={`${data.raids.cleared_this_week} of ${data.raids.bosses_total} raid bosses this week`}
                    description="Raids reset weekly, world bosses and dungeon paths daily. Each figure here is for the reset you are in."
                >
                    <Meter value={data.raids.cleared_this_week} max={data.raids.bosses_total} tone={RAIDS} showCount />

                    <dl className="grid gap-4 sm:grid-cols-3">
                        <SummaryFact
                            value={`${data.raids.cleared_this_week} / ${data.raids.bosses_total}`}
                            label="raid bosses this week"
                        />
                        <SummaryFact
                            value={`${data.world_bosses.killed_today} / ${data.world_bosses.total}`}
                            label="world bosses today"
                        />
                        <SummaryFact value={String(data.dungeons.paths_today)} label="dungeon paths today" />
                    </dl>
                </PageSummary>

                <section className="space-y-4">
                    <SectionHeader
                        title="Raid wings"
                        description={`Cleared this week comes from the game. Since you connected is ours${
                            since ? ` — counted from ${since}` : ""
                        }.`}
                    />

                    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {data.raids.wings.map((wing) => (
                            <li key={`${wing.raid}-${wing.wing}`}>
                                <WingCard wing={wing} />
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="space-y-5">
                <Gw2Panel title="Where these numbers come from">
                    <p className="text-sm text-[var(--ink-mid)]">
                        <strong className="text-[var(--ink-hi)]">This week</strong> and{" "}
                        <strong className="text-[var(--ink-hi)]">today</strong> come from the game.{" "}
                        <strong className="text-[var(--ink-hi)]">Ever</strong> is ours: Guild Wars 2 reports raids
                        for the current week and bosses for the current day and keeps no history at all, so we count
                        from the day you connected
                        {since && <> — {since}</>}. Anything before that is not something we can know.
                    </p>
                </Gw2Panel>

                <WorldBosses bosses={data.world_bosses} />
                <Dungeons dungeons={data.dungeons} />
            </div>
        </div>
    );
}

/**
 * One wing, its bosses as rows.
 *
 * A wing cleared in full this week turns its bar and its ticks green — the one
 * state worth seeing from across the page. Checkpoints stay out of the rows as
 * they stay out of the count: an event between two bosses is not a boss.
 */
function WingCard({ wing }: { wing: RaidWing }) {
    const bosses = wing.encounters.filter((e) => e.type === "Boss");
    const full = wing.bosses > 0 && wing.cleared_this_week >= wing.bosses;

    return (
        <Gw2Card className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[var(--ink-low)]">{wing.raid}</p>
                    <h3 className="mt-0.5 flex min-w-0 items-center gap-1 font-display text-[16px] font-semibold leading-snug text-[var(--ink-hi)]">
                        <span className="min-w-0 truncate">{wing.wing}</span>
                        <WikiLink wiki={wing.wiki} name={wing.wing} compact />
                    </h3>
                </div>
                <span className="shrink-0 font-numeric text-lg font-semibold leading-tight text-[var(--ink-hi)]">
                    {wing.cleared_this_week}
                    <span className="text-xs font-normal text-[var(--ink-low)]"> / {wing.bosses} this week</span>
                </span>
            </div>

            <Meter
                value={wing.cleared_this_week}
                max={wing.bosses}
                segmentLimit={12}
                size="sm"
                tone={full ? "var(--success)" : RAIDS}
            />

            <ul className="space-y-1.5">
                {bosses.map((boss) => (
                    <li key={boss.id} className="flex items-center gap-2 text-[13px]">
                        {boss.cleared_this_week ? (
                            <Check
                                size={14}
                                className="shrink-0"
                                style={{ color: full ? "var(--success)" : "var(--ink-mid)" }}
                                aria-label="Cleared this week"
                            />
                        ) : (
                            <Circle size={11} className="mx-[1.5px] shrink-0 text-[var(--ink-faint)]" aria-label="Not cleared this week" />
                        )}
                        <span
                            className="min-w-0 flex-1 truncate"
                            style={{
                                color: boss.cleared_this_week
                                    ? "var(--ink-hi)"
                                    : boss.ever_cleared
                                      ? "var(--ink-low)"
                                      : "var(--ink-faint)",
                            }}
                        >
                            {boss.name}
                        </span>
                        <WikiLink wiki={boss.wiki} name={boss.name} compact />
                        <span
                            className="w-[72px] shrink-0 text-right text-[11px]"
                            style={{ color: boss.cleared_this_week ? "var(--ink-mid)" : "var(--ink-faint)" }}
                        >
                            {boss.cleared_this_week ? "this week" : boss.ever_cleared ? "seen before" : ""}
                        </span>
                    </li>
                ))}
            </ul>

            <p className="mt-auto border-t pt-2.5 text-[11px] text-[var(--ink-low)]" style={{ borderColor: "var(--line)" }}>
                {wing.ever_cleared > 0
                    ? `${wing.ever_cleared} of ${wing.bosses} cleared since you connected`
                    : "None cleared since you connected"}
            </p>
        </Gw2Card>
    );
}

function WorldBosses({ bosses }: { bosses: Gw2Content["world_bosses"] }) {
    return (
        <Gw2Panel
            title="World bosses"
            description="Today, from the game"
            meta={
                <span className="shrink-0 font-numeric text-xs text-[var(--ink-mid)]">
                    {bosses.killed_today} / {bosses.total}
                </span>
            }
        >
            <ul className="space-y-1.5">
                {bosses.bosses.map((boss) => (
                    <li key={boss.id} className="flex items-center gap-2 text-sm">
                        {boss.killed_today ? (
                            <Check size={14} className="shrink-0 text-[var(--success)]" aria-label="Killed today" />
                        ) : (
                            <span
                                className="mx-[4px] h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: boss.ever_killed ? "var(--ink-faint)" : "var(--fill-3)" }}
                                aria-hidden
                            />
                        )}
                        <span
                            className="min-w-0 flex-1 truncate"
                            style={{ color: boss.killed_today ? "var(--ink-hi)" : "var(--ink-low)" }}
                        >
                            {boss.name}
                        </span>
                        <WikiLink wiki={boss.wiki} name={boss.name} compact />
                    </li>
                ))}
            </ul>
            <p className="mt-3 text-[11px] text-[var(--ink-faint)]">
                A tick means killed today. A grey dot means we have seen you kill it before.
            </p>
        </Gw2Panel>
    );
}

function Dungeons({ dungeons }: { dungeons: Gw2Content["dungeons"] }) {
    return (
        <Gw2Panel
            title="Dungeons"
            description="Paths run today"
            meta={<span className="shrink-0 text-xs text-[var(--ink-mid)]">{dungeons.paths_today} today</span>}
        >
            <ul className="space-y-2.5">
                {dungeons.dungeons.map((dungeon) => (
                    <li key={dungeon.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <span
                                className="min-w-0 truncate"
                                style={{ color: dungeon.run_today > 0 ? "var(--ink-hi)" : "var(--ink-mid)" }}
                            >
                                {dungeon.name}
                            </span>
                            <WikiLink wiki={dungeon.wiki} name={dungeon.name} compact />
                            <span className="ml-auto shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                {dungeon.run_today} / {dungeon.paths.length}
                            </span>
                        </div>
                        <Meter value={dungeon.run_today} max={dungeon.paths.length} size="sm" tone={RAIDS} />
                    </li>
                ))}
            </ul>
        </Gw2Panel>
    );
}

function ConnectFirst() {
    return (
        <Gw2Panel title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    What you have cleared is read from your own Guild Wars 2 account.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Gw2Panel>
    );
}
