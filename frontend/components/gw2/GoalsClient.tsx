"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Hammer, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Meter from "@/components/ui/Meter";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { Gw2Card, SummaryFact } from "@/components/gw2/Gw2PageParts";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import {
    coin,
    getPlan,
    searchItems,
    type Gw2ItemSummary,
    type Gw2Plan,
    type PlanLine,
    type PlanNode,
} from "@/lib/gw2";

/**
 * Plan a crafting goal.
 *
 * The player names the item and the plan follows from that. An ascended set
 * has its own page now (/gw2/ascended), which reads the stats and the weight
 * off the character; this one is for everything else, and for a single piece
 * that page hands over with `?item=`.
 *
 * What it has that a naive planner does not is the subtraction done right. A
 * material reaches the same plan down several branches, and the stock has to
 * be spent once rather than read by each — otherwise every branch reports a
 * shortfall smaller than it is and the player finds out at the crafting
 * station.
 *
 * The cost is the nightly trading post read and says so. What nobody sells —
 * vendors, currencies, time gates, drops — is listed beside it and never added
 * in, because there is no exchange rate between those and gold.
 *
 * Drawn in the redesign's language (phase 6): the search as the head of the
 * page, the target as a summary panel with its facts, the shopping list as
 * tiles, the breakdown as a tree with the game's icons, and the cost, what is
 * counted and the account's disciplines in the right-hand column.
 */

/** Crafting's colour, for the bars on the shopping list and nowhere else. */
const CRAFTING = DOMAIN_TONE.crafting;

export default function GoalsClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Gw2ItemSummary[]>([]);
    const [searching, setSearching] = useState(false);
    const [plan, setPlan] = useState<Gw2Plan | null>(null);
    const [planning, setPlanning] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [target, setTarget] = useState<Gw2ItemSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Each keystroke starts a search; only the last one may set state.
    const latest = useRef(0);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);

            return;
        }

        const ticket = ++latest.current;
        const timer = setTimeout(async () => {
            setSearching(true);

            try {
                const found = await searchItems(query.trim());

                if (ticket === latest.current) setResults(found);
            } catch {
                if (ticket === latest.current) setResults([]);
            } finally {
                if (ticket === latest.current) setSearching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    const build = useCallback(async (item: Gw2ItemSummary, howMany: number) => {
        setPlanning(true);
        setError(null);
        setTarget(item);
        setResults([]);
        setQuery("");

        try {
            setPlan(await getPlan(item.id, howMany));
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message;

            setError(message ?? "We could not build that plan.");
            setPlan(null);
        } finally {
            setPlanning(false);
        }
    }, []);

    /*
     * `?item=` opens a plan straight away — how the legendary and ascended
     * pages hand an item over. Read from the location rather than
     * useSearchParams so the page needs no Suspense boundary; it only matters
     * after sign-in anyway.
     */
    useEffect(() => {
        if (authLoading || !user) return;

        const id = Number(new URLSearchParams(window.location.search).get("item"));

        if (Number.isInteger(id) && id > 0) {
            void build({ id, name: `Item ${id}`, rarity: null, type: null, level: 0, icon: null }, 1);
        }
    }, [authLoading, user, build]);

    if (!authLoading && !user) {
        return (
            <Gw2Panel title="Connect your account first">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        A plan is only useful once we know what you already have. That comes from your own
                        Guild Wars 2 account.
                    </p>
                    <Button asChild>
                        <Link href="/gw2">Go to the advisor</Link>
                    </Button>
                </div>
            </Gw2Panel>
        );
    }

    if (authLoading) {
        return <Skeleton className="h-72 w-full" />;
    }

    return (
        <div className="space-y-6">
            <section
                className="rounded-[var(--radius-panel)] border p-5 md:p-6"
                style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
            >
                <div className="space-y-4">
                    <SectionHeader
                        title="What are you making?"
                        description="Anything with a recipe. What you already own is counted once, wherever it sits."
                    />

                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="gw2-item"
                                className="mb-1.5 block text-xs font-medium text-[var(--ink-low)]"
                            >
                                Search the item
                            </label>
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"
                                    aria-hidden
                                />
                                <Input
                                    id="gw2-item"
                                    value={query}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                                    placeholder="Ascended, Deldrimor, Damask…"
                                    className="pl-9"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="w-24">
                            <label
                                htmlFor="gw2-qty"
                                className="mb-1.5 block text-xs font-medium text-[var(--ink-low)]"
                            >
                                How many
                            </label>
                            <Input
                                id="gw2-qty"
                                type="number"
                                min={1}
                                max={250}
                                value={quantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setQuantity(Math.max(1, Math.min(250, Number(e.target.value) || 1)))
                                }
                            />
                        </div>

                        {target && (
                            <Button
                                variant="secondary"
                                onClick={() => void build(target, quantity)}
                                isLoading={planning}
                            >
                                Replan
                            </Button>
                        )}
                    </div>

                    {searching && <p className="text-xs text-[var(--ink-faint)]">Searching…</p>}

                    {results.length > 0 && (
                        <ul
                            className="divide-y overflow-hidden rounded-[var(--radius-card)] border"
                            style={{ borderColor: "var(--line-strong)", background: "var(--fill-1)" }}
                        >
                            {results.map((item) => (
                                <li key={item.id} style={{ borderColor: "var(--line)" }}>
                                    <button
                                        type="button"
                                        onClick={() => void build(item, quantity)}
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--fill-1)]"
                                    >
                                        <ItemIcon icon={item.icon} rarity={item.rarity} />
                                        <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink-hi)]">
                                            {item.name}
                                        </span>
                                        <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">
                                            {item.rarity} {item.type}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {error && (
                <Gw2Card>
                    <p className="text-sm text-[var(--ink-mid)]">{error}</p>
                </Gw2Card>
            )}

            {planning && <Skeleton className="h-64 w-full" />}

            {plan && !planning && <PlanView plan={plan} />}
        </div>
    );
}

function PlanView({ plan }: { plan: Gw2Plan }) {
    /*
     * Items only. A forge recipe can need coin, counted in copper, and a
     * spirit shard is not a material either — added in, either would swamp the
     * count it sits in.
     */
    const items = plan.shopping_list.filter((line) => !line.currency_id);
    const outstanding = items.reduce((sum, line) => sum + line.missing, 0);
    const held = items.reduce((sum, line) => sum + line.owned, 0);

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
                <TargetSummary plan={plan} outstanding={outstanding} held={held} />

                {plan.shopping_list.length > 0 && <StillToGet lines={plan.shopping_list} />}

                {plan.craftable && (
                    <section className="space-y-4">
                        <SectionHeader
                            title="How it breaks down"
                            description="Every step from the item down to what you gather or buy. A branch you already have stays closed."
                        />
                        <div
                            className="rounded-[var(--radius-panel)] border px-4 py-3"
                            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
                        >
                            <Branch node={plan.tree} />
                        </div>
                    </section>
                )}
            </div>

            <div className="space-y-5">
                {plan.prices && <CostPanel prices={plan.prices} />}

                <Gw2Panel title="What this counts" description="Where the figures on this page come from">
                    <div className="space-y-3 text-sm text-[var(--ink-mid)]">
                        <p>
                            Everything you own, wherever it is: material storage, the bank, the shared inventory and
                            every character&apos;s bags, added together once.
                        </p>
                        <p>
                            Anything you already have enough of is not broken down further — owning the ingot is the
                            same as owning the ore that went into it.
                        </p>
                        <p className="text-[var(--ink-low)]">
                            Prices are refreshed nightly and every total says when it was taken. They cover only what
                            can actually be bought — anything from a vendor, a currency or a time gate is listed apart,
                            because there is no exchange rate between those and gold.
                        </p>
                        {plan.observed_at && (
                            <p className="text-[11px] text-[var(--ink-faint)]">
                                Your inventory as we last read it, {new Date(plan.observed_at).toLocaleString()}.
                            </p>
                        )}
                    </div>
                </Gw2Panel>

                {plan.disciplines_used.length > 0 && (
                    <Gw2Panel title="Your crafting" description="Disciplines on your characters">
                        <ul className="flex flex-wrap gap-1.5">
                            {plan.disciplines_used.map((discipline) => (
                                <li
                                    key={discipline}
                                    className="rounded-full border border-[var(--line-strong)] bg-[var(--fill-1)] px-2 py-0.5 text-[11px] text-[var(--ink-mid)]"
                                >
                                    {discipline}
                                </li>
                            ))}
                        </ul>
                    </Gw2Panel>
                )}
            </div>
        </div>
    );
}

/**
 * The item being made: what it is, what stands in the way, and the three
 * numbers that matter. `PageSummary`'s box, drawn here rather than through it
 * because the title carries the item's own icon and its wiki link.
 */
function TargetSummary({ plan, outstanding, held }: { plan: Gw2Plan; outstanding: number; held: number }) {
    return (
        <section
            className="rounded-[var(--radius-panel)] border p-5 md:p-6"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            <div className="space-y-5">
                <div className="flex items-start gap-4">
                    <GameIcon src={plan.target.icon} alt="" size="xl" rarity={plan.target.rarity} />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h2 className="font-display text-xl font-semibold leading-tight text-[var(--ink-hi)] md:text-2xl">
                                {plan.target.quantity}× {plan.target.name}
                            </h2>
                            <WikiLink wiki={plan.target.wiki} name={plan.target.name} />
                        </div>
                        {(plan.target.rarity || plan.target.type) && (
                            <p className="mt-1 text-sm text-[var(--ink-low)]">
                                {[plan.target.rarity, plan.target.type].filter(Boolean).join(" ")}
                            </p>
                        )}
                    </div>
                </div>

                {!plan.craftable && (
                    <p className="text-sm text-[var(--ink-mid)]">
                        This is not something with a recipe, so there is nothing to break down. It comes from a
                        vendor, a drop or a reward track.
                    </p>
                )}

                {plan.already_have > 0 && (
                    <p className="inline-flex items-center gap-2 text-sm text-[var(--ink-mid)]">
                        <Check size={15} className="text-[var(--success)]" aria-hidden />
                        You already have {plan.already_have} of these.
                    </p>
                )}

                {plan.requires && !plan.requires.have_it && (
                    <div
                        className="flex gap-3 rounded-[var(--radius-card)] border px-3 py-2.5"
                        style={{ borderColor: "var(--line-strong)", background: "var(--fill-1)" }}
                    >
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden />
                        <p className="text-sm text-[var(--ink-hi)]">
                            This needs {plan.requires.disciplines.join(" or ")} at {plan.requires.min_rating}, and no
                            character on your account has it.
                            {plan.disciplines_used.length > 0 && <> You have {plan.disciplines_used.join(", ")}.</>}
                        </p>
                    </div>
                )}

                {/*
                 * A plan can be fully stocked and still stop at the crafting
                 * station: these recipes are taught by a sheet, and the account
                 * has not learned them.
                 */}
                {plan.recipes_to_learn && plan.recipes_to_learn.length > 0 && (
                    <div
                        className="space-y-2 rounded-[var(--radius-card)] border px-3 py-2.5"
                        style={{ borderColor: "var(--line-strong)", background: "var(--fill-1)" }}
                    >
                        <p className="text-sm text-[var(--ink-hi)]">
                            {plan.recipes_to_learn.length === 1
                                ? "One recipe here has to be learned from a recipe sheet first:"
                                : `${plan.recipes_to_learn.length} recipes here have to be learned from a recipe sheet first:`}
                        </p>
                        <ul className="space-y-1.5">
                            {plan.recipes_to_learn.map((recipe) => (
                                <li key={recipe.recipe_id} className="flex items-center gap-2 text-xs text-[var(--ink-mid)]">
                                    {recipe.icon && <GameIcon src={recipe.icon} alt="" size="sm" />}
                                    <span className="truncate">{recipe.name ?? `#${recipe.item_id}`}</span>
                                    <span className="text-[var(--ink-faint)]">{recipe.disciplines.join(" / ")}</span>
                                    <WikiLink wiki={recipe.wiki} name={recipe.name} compact />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {plan.craftable && (
                    <dl className="grid gap-4 sm:grid-cols-3">
                        <SummaryFact value={String(outstanding)} label="materials still to get" />
                        <SummaryFact value={String(held)} label="already yours" />
                        <SummaryFact
                            value={plan.prices ? coin(plan.prices.buy_now) : "—"}
                            label={plan.prices ? "the missing part, bought now" : "no prices loaded"}
                        />
                    </dl>
                )}
            </div>
        </section>
    );
}

/** The leaves of the plan, as tiles: what each one is, how much of it is yours, and what is left. */
function StillToGet({ lines }: { lines: PlanLine[] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Still to get"
                description="Only what you gather, buy or earn — intermediates you can make are in the breakdown below."
            />

            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {lines.map((line) => (
                    <li key={line.currency_id ? `c${line.currency_id}` : line.item_id}>
                        <MaterialTile line={line} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

function MaterialTile({ line }: { line: PlanLine }) {
    const covered = line.missing === 0;

    return (
        <div
            className="flex h-full items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            <ItemIcon icon={line.icon} rarity={line.rarity} />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1">
                    <span className="truncate text-[13px] text-[var(--ink-hi)]">{line.name ?? `#${line.item_id}`}</span>
                    <WikiLink wiki={line.wiki} name={line.name} compact />
                </div>
                <Meter value={line.owned} max={line.needed} size="sm" tone={covered ? "var(--success)" : CRAFTING} segmentLimit={0} />
                <p className="flex justify-between gap-2 text-[11px]">
                    <span className="font-numeric text-[var(--ink-mid)]">
                        {line.currency_id === 1 ? `${coin(line.owned)} / ${coin(line.needed)}` : `${line.owned} / ${line.needed}`}
                    </span>
                    <span className="font-numeric" style={{ color: covered ? "var(--success)" : "var(--ink-hi)" }}>
                        {/* Coin is copper: the game's own notation reads better than a raw count. */}
                        {covered ? "covered" : line.currency_id === 1 ? coin(line.missing) : `+${line.missing}`}
                    </span>
                </p>
            </div>
        </div>
    );
}

/**
 * What the missing part costs.
 *
 * The other bucket is listed rather than added. §13.2 forbids collapsing
 * account-bound and time-gated requirements into a gold figure, and these have
 * no exchange rate to gold at all.
 */
function CostPanel({ prices }: { prices: NonNullable<Gw2Plan["prices"]> }) {
    return (
        <Gw2Panel title="What the missing part costs" description="Trading post, nightly read">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="font-numeric text-lg font-semibold text-[var(--ink-hi)]">{coin(prices.buy_now)}</div>
                        <div className="text-[11px] text-[var(--ink-low)]">buying outright</div>
                    </div>
                    <div>
                        <div className="font-numeric text-lg font-semibold text-[var(--ink-mid)]">{coin(prices.bid_and_wait)}</div>
                        <div className="text-[11px] text-[var(--ink-low)]">bidding and waiting</div>
                    </div>
                </div>

                {prices.not_tradable.length > 0 && (
                    <div className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        <p className="text-xs font-medium text-[var(--ink-low)]">Not buyable at any price</p>
                        <ul className="space-y-1">
                            {prices.not_tradable.map((line) => (
                                <li key={line.item_id} className="flex items-center justify-between gap-2 text-sm text-[var(--ink-mid)]">
                                    <span className="truncate">{line.name}</span>
                                    <WikiLink wiki={line.wiki} name={line.name} compact />
                                    <span className="ml-auto shrink-0 font-numeric text-xs">×{line.missing}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-[11px] text-[var(--ink-faint)]">
                            Vendors, currencies, time gates or drops. There is no gold figure for these, so they are not in
                            the totals above.
                        </p>
                    </div>
                )}

                {prices.currencies && prices.currencies.length > 0 && (
                    <div className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        <p className="text-xs font-medium text-[var(--ink-low)]">Currencies still short</p>
                        <ul className="space-y-1">
                            {prices.currencies.map((c) => (
                                <li key={c.currency_id} className="flex justify-between gap-2 text-sm text-[var(--ink-mid)]">
                                    <span className="truncate">{c.name ?? `Currency ${c.currency_id}`}</span>
                                    <span className="shrink-0 font-numeric text-xs">×{c.missing}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {prices.observed_at && (
                    <p className="text-[11px] text-[var(--ink-faint)]">
                        Trading post as of {new Date(prices.observed_at).toLocaleString()}.
                    </p>
                )}
            </div>
        </Gw2Panel>
    );
}

/** One level of the breakdown. Satisfied branches stay closed — there is nothing under them to do. */
function Branch({ node }: { node: PlanNode }) {
    const open = node.missing > 0;

    return (
        <ul className="space-y-0.5">
            <li>
                <div
                    className="flex items-center gap-2 py-1 text-sm"
                    style={{ paddingLeft: `${Math.min(node.depth, 6) * 16}px` }}
                >
                    {node.icon ? (
                        <GameIcon src={node.icon} alt="" size="sm" rarity={node.rarity} dim={!open} />
                    ) : node.craftable ? (
                        <Hammer size={12} className="mx-1.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
                    ) : (
                        <span aria-hidden className="h-6 w-6 shrink-0" />
                    )}
                    <span className="truncate" style={{ color: open ? "var(--ink-hi)" : "var(--ink-faint)" }}>
                        {node.name ?? `#${node.item_id}`}
                    </span>
                    {node.craftable && node.icon && (
                        <Hammer size={11} className="shrink-0 text-[var(--ink-faint)]" aria-label="Crafted" />
                    )}
                    <WikiLink wiki={node.wiki} name={node.name} compact />
                    {/*
                     * A forge step says where its recipe came from, because the
                     * game does not publish it; a random one says the count is
                     * an average, because it is.
                     */}
                    {node.forge && (
                        <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">
                            Mystic Forge
                            {node.forge.random && ` · about ${node.forge.attempts} attempts, on average`}
                            {!!node.forge.other_recipes && ` · 1 of ${node.forge.other_recipes + 1} recipes`}
                            {node.forge.source_url && (
                                <>
                                    {" · "}
                                    <a
                                        href={node.forge.source_url}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        title={node.forge.source_label ?? undefined}
                                        className="underline hover:text-[var(--accent-ink)]"
                                    >
                                        source
                                    </a>
                                </>
                            )}
                        </span>
                    )}
                    <span
                        className="ml-auto shrink-0 pl-4 font-numeric text-xs"
                        style={{ color: open ? "var(--ink-low)" : "var(--success)" }}
                    >
                        {open
                            ? node.currency_id === 1
                                ? `${coin(node.missing)} of ${coin(node.needed)}`
                                : `${node.missing} of ${node.needed}`
                            : "have it"}
                    </span>
                </div>

                {node.children.map((child, i) => (
                    <Branch key={`${child.currency_id ? `c${child.currency_id}` : child.item_id}-${child.depth}-${i}`} node={child} />
                ))}
            </li>
        </ul>
    );
}

/** A game icon in its rarity frame, or a blank tile of the same size when the item has none. */
function ItemIcon({ icon, rarity }: { icon: string | null; rarity?: string | null }) {
    if (!icon) {
        return <span aria-hidden className="h-9 w-9 shrink-0 rounded-[4px] bg-[var(--fill-2)]" />;
    }

    return <GameIcon src={icon} alt="" size="md" rarity={rarity} />;
}
