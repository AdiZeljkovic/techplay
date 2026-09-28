"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Hammer, PackageCheck, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Meter from "@/components/ui/Meter";
import Chip from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    getPlan,
    searchItems,
    type Gw2ItemSummary,
    type Gw2Plan,
    type PlanNode,
} from "@/lib/gw2";

/**
 * Plan a crafting goal.
 *
 * The mockup is an Ascended Set Planner with the target already decided —
 * Berserker's, six pieces. We cannot decide it: an ascended set comes in a stat
 * prefix and an armour weight, and nothing in the API says which one somebody
 * wants, so a planner that picked would be confidently planning the wrong set.
 * The player names the item and the plan follows from that.
 *
 * What it does have that the mockup does not is the subtraction done right.
 * A material reaches the same plan down several branches, and the stock has to
 * be spent once rather than read by each — otherwise every branch reports a
 * shortfall smaller than it is and the player finds out at the crafting station.
 *
 * What it does not have is the mockup's "18g 42s estimated remaining cost".
 * Trading post prices are live market data we do not mirror, so that figure
 * would be invented. The page says so instead of implying one.
 */
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

    if (!authLoading && !user) {
        return (
            <Panel material="lit" crown title="Connect your account first">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        A plan is only useful once we know what you already have. That comes from your own
                        Guild Wars 2 account.
                    </p>
                    <Button asChild>
                        <Link href="/gw2">Go to the advisor</Link>
                    </Button>
                </div>
            </Panel>
        );
    }

    if (authLoading) {
        return <Skeleton className="h-72 w-full" />;
    }

    return (
        <div className="space-y-5">
            <Panel material="instrument" title="What are you making?">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-0 flex-1">
                            <label htmlFor="gw2-item" className="mb-1.5 block text-sm text-[var(--ink-mid)]">
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
                            <label htmlFor="gw2-qty" className="mb-1.5 block text-sm text-[var(--ink-mid)]">
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
                        <ul className="divide-y rounded-[var(--radius-card)] border" style={{ borderColor: "var(--line)" }}>
                            {results.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => void build(item, quantity)}
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--fill-1)]"
                                    >
                                        <ItemIcon icon={item.icon} name={item.name} />
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
            </Panel>

            {error && (
                <Panel material="matte">
                    <p className="text-sm text-[var(--ink-mid)]">{error}</p>
                </Panel>
            )}

            {planning && <Skeleton className="h-64 w-full" />}

            {plan && !planning && <PlanView plan={plan} />}
        </div>
    );
}

function PlanView({ plan }: { plan: Gw2Plan }) {
    const outstanding = plan.shopping_list.reduce((sum, line) => sum + line.missing, 0);
    const held = plan.shopping_list.reduce((sum, line) => sum + line.owned, 0);

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
                <Panel material="lit" crown title={`${plan.target.quantity}× ${plan.target.name}`}>
                    <div className="space-y-4">
                        {!plan.craftable && (
                            <p className="text-sm text-[var(--ink-mid)]">
                                This is not something with a recipe, so there is nothing to break down. It
                                comes from a vendor, a drop or a reward track.
                            </p>
                        )}

                        {plan.already_have > 0 && (
                            <p className="inline-flex items-center gap-2 text-sm text-[var(--ink-mid)]">
                                <PackageCheck size={15} className="text-[var(--ink-low)]" aria-hidden />
                                You already have {plan.already_have} of these.
                            </p>
                        )}

                        {plan.requires && !plan.requires.have_it && (
                            <div
                                className="flex gap-3 rounded-[var(--radius-card)] border px-3 py-2.5"
                                style={{
                                    borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                                    background: "var(--accent-soft)",
                                }}
                            >
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                                <p className="text-sm text-[var(--ink-hi)]">
                                    This needs {plan.requires.disciplines.join(" or ")} at{" "}
                                    {plan.requires.min_rating}, and no character on your account has it.
                                    {plan.disciplines_used.length > 0 && (
                                        <> You have {plan.disciplines_used.join(", ")}.</>
                                    )}
                                </p>
                            </div>
                        )}

                        {plan.craftable && (
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                <span className="text-[var(--ink-mid)]">
                                    <strong className="font-numeric text-[var(--ink-hi)]">{outstanding}</strong>{" "}
                                    materials still to get
                                </span>
                                <span className="text-[var(--ink-mid)]">
                                    <strong className="font-numeric text-[var(--ink-hi)]">{held}</strong> already
                                    yours
                                </span>
                            </div>
                        )}
                    </div>
                </Panel>

                {plan.shopping_list.length > 0 && (
                    <Panel material="matte" title="Still to get">
                        <ul className="space-y-3">
                            {plan.shopping_list.map((line) => (
                                <li key={line.item_id} className="flex items-center gap-3">
                                    <ItemIcon icon={line.icon} name={line.name ?? ""} />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="truncate text-sm text-[var(--ink-hi)]">
                                                {line.name ?? `#${line.item_id}`}
                                            </span>
                                            <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                                {line.owned} / {line.needed}
                                            </span>
                                        </div>
                                        <Meter value={line.owned} max={line.needed} size="sm" />
                                    </div>

                                    <span className="w-16 shrink-0 text-right font-numeric text-sm text-[var(--accent-ink)]">
                                        +{line.missing}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                )}

                {plan.craftable && (
                    <Panel material="matte" title="How it breaks down">
                        <Branch node={plan.tree} />
                    </Panel>
                )}
            </div>

            <div className="space-y-5">
                <Panel material="matte" title="What this counts">
                    <div className="space-y-3 text-sm text-[var(--ink-mid)]">
                        <p>
                            Everything you own, wherever it is: material storage, the bank, the shared
                            inventory and every character&apos;s bags, added together once.
                        </p>
                        <p>
                            Anything you already have enough of is not broken down further — owning the
                            ingot is the same as owning the ore that went into it.
                        </p>
                        <p className="text-[var(--ink-low)]">
                            {/*
                             * Said plainly rather than left for somebody to
                             * discover. The mockup shows a gold total; we do not
                             * mirror trading post prices, so we do not show one.
                             */}
                            No prices. Trading post values change by the minute and we do not mirror them,
                            so this is a materials plan rather than a cost.
                        </p>
                        {plan.observed_at && (
                            <p className="text-[11px] text-[var(--ink-faint)]">
                                Your inventory as we last read it, {new Date(plan.observed_at).toLocaleString()}.
                            </p>
                        )}
                    </div>
                </Panel>

                {plan.disciplines_used.length > 0 && (
                    <Panel material="matte" title="Your crafting">
                        <div className="flex flex-wrap gap-1.5">
                            {plan.disciplines_used.map((discipline) => (
                                <Chip key={discipline} variant="neutral" size="sm">
                                    {discipline}
                                </Chip>
                            ))}
                        </div>
                    </Panel>
                )}
            </div>
        </div>
    );
}

/** One level of the breakdown. Satisfied branches stay closed — there is nothing under them to do. */
function Branch({ node }: { node: PlanNode }) {
    return (
        <ul className="space-y-1.5">
            <li>
                <div
                    className="flex items-center gap-2 py-1 text-sm"
                    style={{ paddingLeft: `${Math.min(node.depth, 6) * 14}px` }}
                >
                    {node.craftable ? (
                        <Hammer size={12} className="shrink-0 text-[var(--ink-faint)]" aria-hidden />
                    ) : (
                        <span className="w-3" />
                    )}
                    <span
                        className="truncate"
                        style={{ color: node.missing > 0 ? "var(--ink-hi)" : "var(--ink-faint)" }}
                    >
                        {node.name ?? `#${node.item_id}`}
                    </span>
                    <span className="ml-auto shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                        {node.missing > 0 ? `${node.missing} of ${node.needed}` : "have it"}
                    </span>
                </div>

                {node.children.map((child) => (
                    <Branch key={`${child.item_id}-${child.depth}`} node={child} />
                ))}
            </li>
        </ul>
    );
}

function ItemIcon({ icon, name }: { icon: string | null; name: string }) {
    if (!icon) {
        return <span className="h-8 w-8 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)]" />;
    }

    return (
        <Image
            src={icon}
            alt=""
            width={32}
            height={32}
            // ArenaNet's own CDN. Ours optimises our uploads; theirs is already
            // doing the job for these.
            unoptimized
            className="h-8 w-8 shrink-0 rounded-[var(--radius-inner)]"
            title={name}
        />
    );
}
