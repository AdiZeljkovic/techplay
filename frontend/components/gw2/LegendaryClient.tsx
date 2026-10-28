"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import Chip from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { getLegendaries, type Gw2Legendaries } from "@/lib/gw2";

/**
 * Every legendary, what the account holds of it, and whether we can plan it.
 *
 * The list is the game's own. "Can plan" is ours, and strict: the last step
 * has to be a discipline recipe from the API or a Mystic Forge recipe with a
 * named source. A legendary planned halfway, with the forge step silently
 * missing, would be worse than one that says the recipe is not in yet. The
 * sources are credited here because the main one, an open dataset, asks for it.
 */
export default function LegendaryClient() {
    const { user, isLoading } = useAuth();
    const [data, setData] = useState<Gw2Legendaries | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "none">("loading");
    const [picked, setPicked] = useState<number | null>(null);
    const [today, setToday] = useState<Gw2Legendaries["today"] | null>(null);

    useEffect(() => {
        // Signed out is derived at render, not stored: nothing to fetch.
        if (isLoading || !user) return;

        let cancelled = false;

        getLegendaries()
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setState(result ? "ready" : "none");
            })
            .catch(() => {
                if (!cancelled) setState("none");
            });

        return () => {
            cancelled = true;
        };
    }, [isLoading, user]);

    useEffect(() => {
        if (picked === null) return;

        let cancelled = false;

        getLegendaries(picked)
            .then((result) => {
                if (!cancelled) setToday(result?.today ?? []);
            })
            .catch(() => {
                if (!cancelled) setToday([]);
            });

        return () => {
            cancelled = true;
        };
    }, [picked]);

    const groups = useMemo(() => {
        const out = new Map<string, Gw2Legendaries["legendaries"]>();

        for (const item of data?.legendaries ?? []) {
            const key = item.type ?? "Other";
            out.set(key, [...(out.get(key) ?? []), item]);
        }

        return [...out.entries()];
    }, [data]);

    const signedOut = !isLoading && !user;

    if (!signedOut && state === "loading") return <Skeleton className="h-96 w-full" />;

    if (signedOut || state === "none" || !data) {
        return (
            <Panel material="lit" crown title="Connect your account first">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        What you hold and what a legendary still needs come from your own Guild Wars 2 account.
                    </p>
                    <Button asChild>
                        <Link href="/gw2">Go to the advisor</Link>
                    </Button>
                </div>
            </Panel>
        );
    }

    const plannable = data.legendaries.filter((l) => l.plannable).length;
    const choice = data.legendaries.find((l) => l.item_id === picked) ?? null;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
                <Panel material="instrument">
                    <p className="text-sm text-[var(--ink-mid)]">
                        {plannable} of {data.legendaries.length} legendaries can be planned now. Most legendaries end in
                        the Mystic Forge, and the game&apos;s API does not publish forge recipes — so every one used
                        here carries its source, and a legendary without one says so rather than being planned
                        halfway.
                    </p>
                    {!!data.forge_sources?.length && (
                        <ul className="mt-3 space-y-1 text-xs text-[var(--ink-low)]">
                            {data.forge_sources.map((source) => (
                                <li key={source.label ?? "editor"}>
                                    {source.recipes} forge recipes from{" "}
                                    {source.url ? (
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="nofollow noopener noreferrer"
                                            className="text-[var(--accent-ink)] hover:underline"
                                        >
                                            {source.label ?? "an editor's entry"}
                                        </a>
                                    ) : (
                                        (source.label ?? "an editor's entry")
                                    )}
                                    {source.as_of && `, as of ${new Date(source.as_of).toLocaleDateString()}`}.
                                    {source.note && ` ${source.note}`}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                {groups.map(([type, items]) => (
                    <Panel key={type} material="matte" title={type}>
                        <ul className="space-y-2">
                            {items.map((item) => (
                                <li key={item.item_id} className="flex items-center gap-2.5 text-sm">
                                    <GameIcon src={item.icon} alt="" size="sm" rarity="Legendary" dim={!item.plannable} />
                                    <button
                                        type="button"
                                        onClick={() => setPicked(item.item_id)}
                                        className="min-w-0 flex-1 truncate text-left text-[var(--ink-hi)] hover:text-[var(--accent-ink)]"
                                    >
                                        {item.name ?? `Item ${item.item_id}`}
                                        {item.subtype && (
                                            <span className="ml-2 text-[11px] text-[var(--ink-faint)]">{item.subtype}</span>
                                        )}
                                    </button>
                                    <WikiLink wiki={item.wiki} name={item.name} compact />
                                    {item.held !== null && item.held > 0 && (
                                        <span className="inline-flex shrink-0 items-center gap-1 font-numeric text-xs text-[var(--accent-ink)]">
                                            <Check size={12} aria-hidden />
                                            {item.held}/{item.max_count}
                                        </span>
                                    )}
                                    {item.plannable ? (
                                        <Link
                                            href={`/gw2/planner?item=${item.item_id}`}
                                            className="shrink-0 text-xs text-[var(--accent-ink)] hover:underline"
                                        >
                                            Plan it
                                        </Link>
                                    ) : (
                                        <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">recipe not in yet</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Panel>
                ))}
            </div>

            <div className="space-y-5">
                <Panel material="lit" crown title={choice?.name ?? "Pick a legendary"}>
                    {!choice ? (
                        <p className="text-sm text-[var(--ink-low)]">
                            Pick one to see which time-gated crafts its plan still needs, and whether today&apos;s is
                            used.
                        </p>
                    ) : (
                        <div className="space-y-3 text-sm">
                            <div className="flex flex-wrap gap-2">
                                <Chip variant={choice.plannable ? "accent" : "neutral"} size="sm">
                                    {choice.plannable === "forge"
                                        ? "Mystic Forge recipe, sourced"
                                        : choice.plannable === "recipe"
                                          ? "Crafting recipe from the game"
                                          : "Recipe not in yet"}
                                </Chip>
                                {choice.held !== null && (
                                    <Chip variant="neutral" size="sm">
                                        In your armory: {choice.held} of {choice.max_count}
                                    </Chip>
                                )}
                            </div>

                            {choice.plannable && today === null && <Skeleton className="h-16 w-full" />}

                            {choice.plannable && today && today.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                                        Time-gated — one craft a day
                                    </p>
                                    <ul className="space-y-1">
                                        {today.map((gate) => (
                                            <li key={gate.id} className="flex items-center gap-2 text-xs">
                                                <Clock size={12} className="shrink-0 text-[var(--ink-faint)]" aria-hidden />
                                                <span className="flex-1 text-[var(--ink-mid)]">
                                                    {gate.name} — {gate.missing} still needed
                                                </span>
                                                <span
                                                    className="shrink-0"
                                                    style={{ color: gate.crafted_today ? "var(--ink-faint)" : "var(--accent-ink)" }}
                                                >
                                                    {gate.crafted_today === null
                                                        ? ""
                                                        : gate.crafted_today
                                                          ? "done today"
                                                          : "craft today"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {choice.plannable && today && today.length === 0 && (
                                <p className="text-xs text-[var(--ink-low)]">
                                    Nothing in this plan is time-gated, or you already have enough of it.
                                </p>
                            )}

                            {choice.plannable && (
                                <Button asChild size="sm">
                                    <Link href={`/gw2/planner?item=${choice.item_id}`}>Open the full plan</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </Panel>
            </div>
        </div>
    );
}
