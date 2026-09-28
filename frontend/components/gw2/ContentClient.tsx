"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Info, Swords } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import { Skeleton } from "@/components/ui/Skeleton";
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
 */
export default function ContentClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Content | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");

    const load = useCallback(async () => {
        try {
            const payload = await getContent();

            setData(payload);
            setState(payload ? "ready" : "none");
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            setState(status === 404 ? "none" : "error");
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        void load();
    }, [authLoading, user, load]);

    if (!authLoading && !user) return <ConnectFirst />;
    if (authLoading || state === "loading") return <Skeleton className="h-96 w-full" />;

    if (state === "error") {
        return (
            <Panel material="matte">
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">
                        We could not load this. It is a problem reaching our own server.
                    </p>
                    <Button variant="secondary" onClick={() => void load()}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !data) return <ConnectFirst />;

    return (
        <div className="space-y-5">
            <Panel material="instrument">
                <div className="flex gap-3">
                    <Info size={16} className="mt-0.5 shrink-0 text-[var(--ink-low)]" aria-hidden />
                    <p className="text-sm text-[var(--ink-mid)]">
                        <strong className="text-[var(--ink-hi)]">This week</strong> and{" "}
                        <strong className="text-[var(--ink-hi)]">today</strong> come from the game.{" "}
                        <strong className="text-[var(--ink-hi)]">Ever</strong> is ours: Guild Wars 2 reports
                        raids for the current week and bosses for the current day and keeps no history at
                        all, so we count from the day you connected
                        {data.tracked_since && (
                            <> — {new Date(data.tracked_since).toLocaleDateString()}</>
                        )}
                        . Anything before that is not something we can know.
                    </p>
                </div>
            </Panel>

            <Panel
                material="matte"
                title="Raids"
                meta={
                    <span className="text-xs text-[var(--ink-faint)]">
                        {data.raids.cleared_this_week} of {data.raids.bosses_total} this week
                    </span>
                }
            >
                <div className="space-y-4">
                    {data.raids.wings.map((wing) => (
                        <Wing key={`${wing.raid}-${wing.wing}`} wing={wing} />
                    ))}
                </div>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
                <Panel
                    material="matte"
                    title="World bosses"
                    meta={
                        <span className="text-xs text-[var(--ink-faint)]">
                            {data.world_bosses.killed_today} of {data.world_bosses.total} today
                        </span>
                    }
                >
                    <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        {data.world_bosses.bosses.map((boss) => (
                            <li key={boss.id} className="flex items-center gap-2 text-sm">
                                <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{
                                        background: boss.killed_today
                                            ? "var(--accent)"
                                            : boss.ever_killed
                                              ? "var(--ink-faint)"
                                              : "var(--fill-3)",
                                    }}
                                    aria-hidden
                                />
                                <span
                                    className="truncate"
                                    style={{
                                        color: boss.killed_today ? "var(--ink-hi)" : "var(--ink-low)",
                                    }}
                                >
                                    {boss.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-[11px] text-[var(--ink-faint)]">
                        Filled means killed today. Grey means we have seen you kill it before.
                    </p>
                </Panel>

                <Panel
                    material="matte"
                    title="Dungeons"
                    meta={
                        <span className="text-xs text-[var(--ink-faint)]">
                            {data.dungeons.paths_today} paths today
                        </span>
                    }
                >
                    <ul className="space-y-2.5">
                        {data.dungeons.dungeons.map((dungeon) => (
                            <li key={dungeon.id} className="flex items-baseline justify-between gap-3 text-sm">
                                <span className="truncate text-[var(--ink-mid)]">{dungeon.name}</span>
                                <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                    {dungeon.run_today} / {dungeon.paths.length}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Panel>
            </div>
        </div>
    );
}

function Wing({ wing }: { wing: RaidWing }) {
    const bosses = wing.encounters.filter((e) => e.type === "Boss");

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex items-baseline gap-2">
                    <Swords size={13} className="self-center text-[var(--ink-faint)]" aria-hidden />
                    <span className="text-sm text-[var(--ink-hi)]">{wing.wing}</span>
                    <span className="text-[11px] text-[var(--ink-faint)]">{wing.raid}</span>
                </div>
                <span className="font-numeric text-xs text-[var(--ink-low)]">
                    {wing.cleared_this_week} / {wing.bosses} this week
                    {wing.ever_cleared > 0 && (
                        <span className="text-[var(--ink-faint)]"> · {wing.ever_cleared} ever</span>
                    )}
                </span>
            </div>

            <Meter value={wing.cleared_this_week} max={wing.bosses} segmentLimit={12} size="sm" />

            <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {bosses.map((boss) => (
                    <li key={boss.id} className="flex items-center gap-1.5 text-xs">
                        {boss.cleared_this_week ? (
                            <Check size={11} className="text-[var(--accent-ink)]" aria-hidden />
                        ) : (
                            <span className="w-[11px]" />
                        )}
                        <span
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
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ConnectFirst() {
    return (
        <Panel material="lit" crown title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    What you have cleared is read from your own Guild Wars 2 account.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Panel>
    );
}
