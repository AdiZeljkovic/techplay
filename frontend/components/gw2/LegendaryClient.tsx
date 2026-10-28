"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookMarked, Check, Clock, Gem, Hammer, Library, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import Segmented from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { getLegendaries, type Gw2Legendaries } from "@/lib/gw2";

/**
 * Every legendary, what the account holds of it, and whether we can plan it.
 *
 * The list is the game's own. "Can plan" is ours, and strict: the last step
 * has to be a discipline recipe from the API or a Mystic Forge recipe with a
 * named source. A legendary planned halfway, with the forge step silently
 * missing, would be worse than one that says the recipe is not in yet. The
 * sources are credited here because the main one, an open dataset, asks for it.
 *
 * Drawn in the redesign's language (phase 6): the count across the top, the
 * legendaries as tiles grouped by type, and the one picked — its time-gated
 * crafts and the way into its plan — in the right-hand column, with the credit
 * for the forge recipes under it.
 */

const LEGENDARY = DOMAIN_TONE.legendary;

type Legendary = Gw2Legendaries["legendaries"][number];

/** The API's type names, as a reader would say them. Anything unknown is shown as it comes. */
const TYPE_LABEL: Record<string, string> = {
    Weapon: "Weapons",
    Armor: "Armour",
    Back: "Back items",
    Trinket: "Trinkets",
    UpgradeComponent: "Runes and sigils",
    Relic: "Relics",
};

function typeLabel(type: string): string {
    return TYPE_LABEL[type] ?? type;
}

export default function LegendaryClient() {
    const { user, isLoading } = useAuth();
    const [data, setData] = useState<Gw2Legendaries | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "none">("loading");
    const [picked, setPicked] = useState<number | null>(null);
    const [today, setToday] = useState<Gw2Legendaries["today"] | null>(null);
    const [type, setType] = useState("all");
    const detail = useRef<HTMLDivElement>(null);

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
        const out = new Map<string, Legendary[]>();

        for (const item of data?.legendaries ?? []) {
            const key = item.type ?? "Other";
            out.set(key, [...(out.get(key) ?? []), item]);
        }

        return [...out.entries()];
    }, [data]);

    /*
     * The previous pick's crafts must not stand under the new name while the
     * new ones load, so they are cleared here, at the click. And below `xl` the
     * detail sits under two hundred tiles: without the scroll a tap would look
     * like it did nothing.
     */
    function pick(itemId: number) {
        if (itemId !== picked) setToday(null);
        setPicked(itemId);

        if (window.matchMedia("(max-width: 1279px)").matches) {
            detail.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

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

    const choice = data.legendaries.find((l) => l.item_id === picked) ?? null;
    const shown = type === "all" ? groups : groups.filter(([t]) => t === type);

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
                <Summary data={data} />

                <section className="space-y-5">
                    <SectionHeader
                        icon={<Gem size={18} />}
                        tone={LEGENDARY}
                        title="Every legendary"
                        description="Pick one to see the crafts it waits on each day. A tick is what your armory already holds."
                        meta={
                            groups.length > 1 ? (
                                <Segmented
                                    ariaLabel="Which legendaries"
                                    value={type}
                                    onChange={setType}
                                    wrap
                                    items={[
                                        { id: "all", label: "All", count: data.legendaries.length },
                                        ...groups.map(([t, items]) => ({ id: t, label: typeLabel(t), count: items.length })),
                                    ]}
                                />
                            ) : undefined
                        }
                    />

                    {shown.map(([groupType, items]) => (
                        <div key={groupType} className="space-y-3">
                            <h3 className="flex items-baseline gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-low)]">
                                {typeLabel(groupType)}
                                <span className="font-numeric text-[11px] font-normal tracking-normal text-[var(--ink-faint)]">
                                    {items.filter((i) => i.plannable).length} of {items.length} plannable
                                </span>
                            </h3>
                            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
                                {items.map((item) => (
                                    <li key={item.item_id}>
                                        <LegendaryTile item={item} on={item.item_id === picked} onPick={() => pick(item.item_id)} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            </div>

            <div ref={detail} className="scroll-mt-24 space-y-5">
                <PickedPanel choice={choice} today={today} />
                {!!data.forge_sources?.length && <SourcesPanel sources={data.forge_sources} />}
            </div>
        </div>
    );
}

/** The panel across the top: how much of the list can be planned, and what is already held. */
function Summary({ data }: { data: Gw2Legendaries }) {
    const total = data.legendaries.length;
    const plannable = data.legendaries.filter((l) => l.plannable).length;
    const held = data.legendaries.filter((l) => (l.held ?? 0) > 0).length;

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-5 md:p-6"
            style={{ background: "var(--surface-1)", borderColor: `color-mix(in srgb, ${LEGENDARY} 40%, var(--line-strong))` }}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(60% 90% at 0% 0%, color-mix(in srgb, ${LEGENDARY} 16%, transparent), transparent 70%)` }}
            />

            <div className="relative space-y-5">
                <div className="flex items-start gap-4">
                    <span
                        aria-hidden
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
                        style={{
                            color: LEGENDARY,
                            borderColor: `color-mix(in srgb, ${LEGENDARY} 70%, transparent)`,
                            boxShadow: `0 0 24px color-mix(in srgb, ${LEGENDARY} 30%, transparent)`,
                        }}
                    >
                        <Sparkles size={26} />
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-display text-xl font-bold leading-tight text-[var(--ink-hi)] md:text-2xl">
                            {plannable} of {total} legendaries can be planned now
                        </h2>
                        <p className="mt-1 text-sm text-[var(--ink-mid)]">
                            Most legendaries end in the Mystic Forge, and the game&apos;s API does not publish forge
                            recipes — so every one used here carries its source, and a legendary without one says so
                            rather than being planned halfway.
                        </p>
                    </div>
                </div>

                <Meter value={plannable} max={total} tone={LEGENDARY} showCount />

                <dl className="grid gap-4 sm:grid-cols-3">
                    <Fact icon={<Hammer size={18} />} value={`${plannable} / ${total}`} label="can be planned" />
                    <Fact
                        icon={<Library size={18} />}
                        value={data.armory_known ? String(held) : "—"}
                        label={data.armory_known ? "already in your armory" : "armory not read yet"}
                    />
                    <Fact
                        icon={<BookMarked size={18} />}
                        value={String(data.forge_recipes_checked)}
                        label="Mystic Forge recipes with a source"
                    />
                </dl>

                {!data.armory_known && (
                    <p className="text-xs text-[var(--ink-low)]">
                        We have no read of your Legendary Armory yet, so nothing below is ticked as held.
                    </p>
                )}
            </div>
        </section>
    );
}

function Fact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <div className="flex items-start gap-3">
            <span
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-card)]"
                style={{ background: "var(--fill-1)", color: "var(--ink-mid)" }}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-lg font-bold leading-tight text-[var(--ink-hi)]">{value}</dd>
                <dd className="text-xs text-[var(--ink-low)]">{label}</dd>
            </div>
        </div>
    );
}

/**
 * One legendary. The name is the button — the tile also carries the plan link
 * and the wiki, and a link inside a button is not a thing a browser keeps.
 */
function LegendaryTile({ item, on, onPick }: { item: Legendary; on: boolean; onPick: () => void }) {
    const held = item.held !== null && item.held > 0;
    const tone = on ? LEGENDARY : held ? "var(--success)" : "var(--line)";

    return (
        <div
            className="flex h-full items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5 transition-colors"
            style={{
                background: on ? `color-mix(in srgb, ${LEGENDARY} 10%, var(--surface-1))` : "var(--surface-1)",
                borderColor: on || held ? `color-mix(in srgb, ${tone} 50%, var(--line))` : "var(--line)",
                boxShadow: on ? `inset 0 -28px 40px -30px color-mix(in srgb, ${LEGENDARY} 40%, transparent)` : undefined,
            }}
        >
            {item.icon ? (
                <GameIcon src={item.icon} alt="" size="md" rarity="Legendary" dim={!item.plannable} />
            ) : (
                <span aria-hidden className="h-9 w-9 shrink-0 rounded-[4px] bg-[var(--fill-2)]" />
            )}

            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={onPick}
                    aria-pressed={on}
                    className="block w-full truncate text-left text-[13px] text-[var(--ink-hi)] hover:text-[var(--accent-ink)]"
                >
                    {item.name ?? `Item ${item.item_id}`}
                </button>
                <p className="flex items-center gap-2 text-[11px]">
                    {item.subtype && <span className="truncate text-[var(--ink-faint)]">{item.subtype}</span>}
                    {held && (
                        <span className="inline-flex shrink-0 items-center gap-1 font-numeric text-[var(--success)]">
                            <Check size={11} aria-hidden />
                            {item.held}/{item.max_count}
                        </span>
                    )}
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <WikiLink wiki={item.wiki} name={item.name} compact />
                {item.plannable ? (
                    <Link
                        href={`/gw2/planner?item=${item.item_id}`}
                        className="rounded-full border px-2.5 py-1 text-[11px] text-[var(--ink-hi)] transition-[filter] hover:brightness-125"
                        style={{
                            background: `color-mix(in srgb, ${LEGENDARY} 18%, var(--surface-2))`,
                            borderColor: `color-mix(in srgb, ${LEGENDARY} 45%, transparent)`,
                        }}
                    >
                        Plan it
                    </Link>
                ) : (
                    <span className="text-[11px] text-[var(--ink-faint)]">recipe not in yet</span>
                )}
            </div>
        </div>
    );
}

/** The legendary picked: where its recipe comes from, what is held, and today's time-gated crafts. */
function PickedPanel({ choice, today }: { choice: Legendary | null; today: Gw2Legendaries["today"] | null }) {
    if (!choice) {
        return (
            <Gw2Panel icon={<Gem size={18} />} title="Pick a legendary" tone={LEGENDARY}>
                <p className="text-sm text-[var(--ink-low)]">
                    Pick one to see which time-gated crafts its plan still needs, and whether today&apos;s is used.
                </p>
            </Gw2Panel>
        );
    }

    return (
        <Gw2Panel
            icon={<Gem size={18} />}
            title={choice.name ?? `Item ${choice.item_id}`}
            description={choice.subtype ?? choice.type ?? undefined}
            tone={LEGENDARY}
            meta={<WikiLink wiki={choice.wiki} name={choice.name} compact />}
        >
            <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                    {choice.icon && <GameIcon src={choice.icon} alt="" size="xl" rarity="Legendary" />}
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                        <Pill tone={choice.plannable ? LEGENDARY : "var(--ink-low)"}>
                            {choice.plannable === "forge"
                                ? "Mystic Forge recipe, sourced"
                                : choice.plannable === "recipe"
                                  ? "Crafting recipe from the game"
                                  : "Recipe not in yet"}
                        </Pill>
                        {choice.held !== null && (
                            <Pill tone={choice.held > 0 ? "var(--success)" : "var(--ink-low)"}>
                                In your armory: {choice.held} of {choice.max_count}
                            </Pill>
                        )}
                    </div>
                </div>

                {choice.plannable && today === null && <Skeleton className="h-16 w-full" />}

                {choice.plannable && today && today.length > 0 && (
                    <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                            Time-gated — one craft a day
                        </p>
                        <ul className="space-y-1.5">
                            {today.map((gate) => (
                                <li key={gate.id} className="flex items-center gap-2 text-xs">
                                    <Clock size={12} className="shrink-0 text-[var(--ink-faint)]" aria-hidden />
                                    <span className="flex-1 text-[var(--ink-mid)]">
                                        {gate.name} — {gate.missing} still needed
                                    </span>
                                    <span
                                        className="shrink-0"
                                        style={{ color: gate.crafted_today ? "var(--ink-faint)" : LEGENDARY }}
                                    >
                                        {gate.crafted_today === null ? "" : gate.crafted_today ? "done today" : "craft today"}
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
                    <ActionLink href={`/gw2/planner?item=${choice.item_id}`} tone={LEGENDARY}>
                        Open the full plan
                    </ActionLink>
                )}
            </div>
        </Gw2Panel>
    );
}

/**
 * The credit for the forge recipes. Kept on the page, not in a footnote: the
 * main source is an open dataset whose licence asks for exactly this.
 */
function SourcesPanel({ sources }: { sources: NonNullable<Gw2Legendaries["forge_sources"]> }) {
    return (
        <Gw2Panel
            icon={<BookMarked size={18} />}
            title="Where the recipes come from"
            description="The game does not publish Mystic Forge recipes"
        >
            <ul className="space-y-2.5 text-xs text-[var(--ink-low)]">
                {sources.map((source) => (
                    <li key={source.label ?? "editor"}>
                        <span className="font-numeric text-[var(--ink-mid)]">{source.recipes}</span> forge recipes from{" "}
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
        </Gw2Panel>
    );
}

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
    return (
        <span
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] text-[var(--ink-hi)]"
            style={{
                borderColor: `color-mix(in srgb, ${tone} 50%, transparent)`,
                background: `color-mix(in srgb, ${tone} 14%, transparent)`,
            }}
        >
            {children}
        </span>
    );
}
