"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, HelpCircle, Minus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import Meter from "@/components/ui/Meter";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import ConnectionPanel from "@/components/gw2/ConnectionPanel";
import { useGw2Shell } from "@/components/gw2/Gw2Shell";
import {
    coin,
    getAccountOverview,
    getConnection,
    type Gw2AccountOverview,
    type Gw2Connection,
    type Gw2OwnedProduct,
} from "@/lib/gw2";

/**
 * What the account owns and what came with it, the legendary armory,
 * collections, and the trading post counter — and, since the redesign of 28
 * October 2026, the connection itself and what has changed since it was made,
 * both of which used to sit down the dashboard's right-hand column.
 *
 * Every panel is null when the key cannot see it, and says which permission
 * that is rather than drawing an empty shelf.
 */
export default function AccountClient() {
    const { user, isLoading } = useAuth();
    const reportConnection = useGw2Shell()?.reportConnection;
    const [data, setData] = useState<Gw2AccountOverview | null>(null);
    const [connection, setConnection] = useState<Gw2Connection | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "none">("loading");

    const loadOverview = useCallback(async () => {
        const overview = await getAccountOverview();

        setData(overview);
        setState(overview ? "ready" : "none");
    }, []);

    useEffect(() => {
        // Signed out is derived at render, not stored: nothing to fetch.
        if (isLoading || !user) return;

        let cancelled = false;

        // The connection panel is extra; failing to read it must not cost the page.
        Promise.all([getAccountOverview(), getConnection().catch(() => null)])
            .then(([overview, connected]) => {
                if (cancelled) return;
                setData(overview);
                setConnection(connected);
                setState(overview ? "ready" : "none");
            })
            .catch(() => {
                if (!cancelled) setState("none");
            });

        return () => {
            cancelled = true;
        };
    }, [isLoading, user]);

    function connectionChanged(next: Gw2Connection | null) {
        setConnection(next);
        reportConnection?.(next);

        // Disconnected: everything on this page was read with the key that
        // has just been deleted.
        if (!next) {
            setData(null);
            setState("none");
        }
    }

    const signedOut = !isLoading && !user;

    if (!signedOut && state === "loading") return <Skeleton className="h-96 w-full" />;

    if (signedOut || state === "none" || !data) {
        return (
            <Panel material="lit" crown title="Connect your account first">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        This page is read from your own Guild Wars 2 account.
                    </p>
                    <Button asChild>
                        <Link href="/gw2">Go to the advisor</Link>
                    </Button>
                </div>
            </Panel>
        );
    }

    return (
        <div className="space-y-5">
            {(connection || data.history) && (
                <div className="grid gap-5 lg:grid-cols-2">
                    {connection && (
                        <ConnectionPanel
                            connection={connection}
                            onChanged={connectionChanged}
                            onRead={() => void loadOverview().catch(() => undefined)}
                        />
                    )}
                    {data.history && <HistoryPanel history={data.history} />}
                </div>
            )}

            <OwnershipPanel products={data.ownership} />

            <div className="grid gap-5 lg:grid-cols-2">
                <TradingPostPanel tp={data.trading_post} />
                <ArmoryPanel armory={data.legendary_armory} />
            </div>

            <CollectionsPanel collections={data.collections} />
        </div>
    );
}

/**
 * What changed between our reads.
 *
 * The date under it has to be shown. The game's API reports raid clears only
 * for the current week and has no lifetime view anywhere, so nothing before the
 * day this account connected exists in any record and never will.
 */
function HistoryPanel({ history }: { history: NonNullable<Gw2AccountOverview["history"]> }) {
    return (
        <Panel material="matte" title="Since you connected">
            {history.events.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">Nothing has changed between reads yet.</p>
            ) : (
                <ul className="space-y-2">
                    {history.events.slice(0, 8).map((event, i) => (
                        <li key={`${event.type}-${event.id}-${i}`} className="flex gap-2 text-sm">
                            <Check size={14} className="mt-0.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
                            <span className="min-w-0 flex-1 text-[var(--ink-mid)]">
                                {event.name ?? event.type.replace(/_/g, " ")}
                            </span>
                            <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">
                                {new Date(event.occurred_at.replace(" ", "T")).toLocaleDateString()}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {history.tracked_since && (
                <p className="mt-3 border-t pt-3 text-[11px] text-[var(--ink-faint)]" style={{ borderColor: "var(--line)" }}>
                    We have been watching since{" "}
                    {new Date(history.tracked_since.replace(" ", "T")).toLocaleDateString()}. Guild Wars 2 keeps no
                    history of its own, so nothing before that can be recovered.
                </p>
            )}
        </Panel>
    );
}

function OwnershipPanel({ products }: { products: Gw2OwnedProduct[] }) {
    const came = products.filter((p) => p.owned && (p.how === "included" || (p.how === "free" && p.kind === "living_world")));

    return (
        <Panel material="lit" crown title="What you own">
            <div className="space-y-4">
                {came.length > 0 && (
                    <p className="text-sm text-[var(--ink-mid)]">
                        Since 13 October 2026 these come with what you have, or are free:{" "}
                        <span className="text-[var(--ink-hi)]">{came.map((p) => p.name).join(", ")}</span>.
                    </p>
                )}
                <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                    {products.map((product) => (
                        <li key={product.key} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                            <span className="mt-0.5 shrink-0" aria-hidden>
                                {product.owned === true ? (
                                    <Check size={15} className="text-[var(--accent-ink)]" />
                                ) : product.owned === null ? (
                                    <HelpCircle size={15} className="text-[var(--ink-faint)]" />
                                ) : (
                                    <Minus size={15} className="text-[var(--ink-faint)]" />
                                )}
                            </span>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                                    <span className={product.owned ? "text-[var(--ink-hi)]" : "text-[var(--ink-low)]"}>
                                        {product.name}
                                    </span>
                                    <span className="text-[11px] text-[var(--ink-faint)]">{ownedLabel(product, products)}</span>
                                </div>
                                {product.grants && (
                                    <p className="text-xs text-[var(--ink-low)]">
                                        {product.grants}
                                        {product.grants_source && <SourceLink source={product.grants_source} />}
                                    </p>
                                )}
                                {product.note && (
                                    <p className="text-[11px] text-[var(--ink-faint)]">
                                        {product.note}
                                        {product.source && <SourceLink source={product.source} />}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Panel>
    );
}

function ownedLabel(product: Gw2OwnedProduct, all: Gw2OwnedProduct[]): string {
    if (product.owned === null) return product.how === "unknown" ? "the game does not say" : "unknown";
    if (!product.owned) return "not owned";
    if (product.how === "free") return "free";
    if (product.how === "included") {
        const names = product.with.map((key) => all.find((p) => p.key === key)?.name ?? key);
        return `comes with ${names.join(" and ")}`;
    }
    return "owned";
}

function SourceLink({ source }: { source: { url: string; label: string | null } }) {
    return (
        <a
            href={source.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            title={source.label ?? source.url}
            className="ml-1 inline-flex items-center align-middle text-[var(--ink-faint)] hover:text-[var(--accent-ink)]"
        >
            <ExternalLink size={10} aria-label={`Source: ${source.label ?? source.url}`} />
        </a>
    );
}

function TradingPostPanel({ tp }: { tp: Gw2AccountOverview["trading_post"] }) {
    if (!tp) {
        return (
            <Panel material="matte" title="Trading post">
                <p className="text-sm text-[var(--ink-low)]">
                    Your key does not include the <strong>tradingpost</strong> permission, or we have not read it yet.
                </p>
            </Panel>
        );
    }

    return (
        <Panel material="instrument" title="Trading post">
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="font-numeric text-lg text-[var(--ink-hi)]">{coin(tp.waiting.coins)}</div>
                        <div className="text-[11px] text-[var(--ink-low)]">waiting at the counter</div>
                    </div>
                    <div>
                        <div className="font-numeric text-lg text-[var(--ink-mid)]">{tp.waiting.items.length}</div>
                        <div className="text-[11px] text-[var(--ink-low)]">item stacks waiting</div>
                    </div>
                </div>

                {tp.waiting.items.length > 0 && (
                    <ul className="space-y-1">
                        {tp.waiting.items.map((item) => (
                            <li key={item.item_id} className="flex items-center gap-2 text-xs">
                                <GameIcon src={item.icon} alt="" size="sm" />
                                <span className="truncate text-[var(--ink-mid)]">
                                    {item.count}× {item.name ?? `Item ${item.item_id}`}
                                </span>
                                <WikiLink wiki={item.wiki} name={item.name} compact />
                            </li>
                        ))}
                    </ul>
                )}

                <div className="border-t pt-3 text-xs text-[var(--ink-mid)]" style={{ borderColor: "var(--line)" }}>
                    <p>
                        {tp.buys.length} buy orders holding <span className="font-numeric">{coin(tp.in_buy_orders)}</span>
                        {" · "}
                        {tp.sells.length} sell orders listed for <span className="font-numeric">{coin(tp.listed_for)}</span>{" "}
                        before the trading post&apos;s cut.
                    </p>
                    {/* No undercut warning: our prices are read once a night, and
                        a warning built on them would be wrong most of the day. */}
                    <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
                        We do not say whether you have been undercut — our prices are from last night, and the
                        market moves faster than that.
                    </p>
                </div>
            </div>
        </Panel>
    );
}

function ArmoryPanel({ armory }: { armory: Gw2AccountOverview["legendary_armory"] }) {
    if (!armory) {
        return (
            <Panel material="matte" title="Legendary armory">
                <p className="text-sm text-[var(--ink-low)]">
                    Your key does not include the <strong>unlocks</strong> permission, or we have not read it yet.
                </p>
            </Panel>
        );
    }

    return (
        <Panel
            material="matte"
            title="Legendary armory"
            meta={
                <span className="font-numeric text-xs text-[var(--ink-faint)]">
                    {armory.owned_count} of {armory.in_catalogue}
                </span>
            }
        >
            {armory.owned.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">
                    No legendaries in the armory yet.{" "}
                    <Link href="/gw2/legendary" className="text-[var(--accent-ink)] hover:underline">
                        See what each one takes
                    </Link>
                    .
                </p>
            ) : (
                <ul className="space-y-2">
                    {armory.owned.map((item) => (
                        <li key={item.item_id} className="flex items-center gap-2.5 text-sm">
                            <GameIcon src={item.icon} alt="" size="sm" rarity="Legendary" />
                            <span className="min-w-0 flex-1 truncate text-[var(--ink-hi)]">{item.name ?? `Item ${item.item_id}`}</span>
                            <WikiLink wiki={item.wiki} name={item.name} compact />
                            <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                {item.count}
                                {item.max_count !== null && ` / ${item.max_count}`}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <p className="mt-3 text-[11px] text-[var(--ink-faint)]">
                The second figure is how many the armory can use — rings and accessories take two, some weapons more.
            </p>
        </Panel>
    );
}

function CollectionsPanel({ collections }: { collections: Gw2AccountOverview["collections"] }) {
    if (!collections) {
        return (
            <Panel material="matte" title="Collections">
                <p className="text-sm text-[var(--ink-low)]">
                    Your key does not include the <strong>unlocks</strong> permission, or we have not read your
                    collections yet. They arrive with the next full read.
                </p>
            </Panel>
        );
    }

    const labels = { skins: "Wardrobe skins", minis: "Miniatures", outfits: "Outfits", titles: "Titles" } as const;

    return (
        <Panel material="matte" title="Collections">
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
                        <div key={key} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--ink-mid)]">{labels[key]}</span>
                                <span className="font-numeric text-xs text-[var(--ink-low)]">
                                    {collections.counts[key].have} / {collections.counts[key].total}
                                </span>
                            </div>
                            <Meter value={collections.counts[key].have} max={Math.max(1, collections.counts[key].total)} size="sm" />
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    {(["skins", "minis", "outfits"] as const).map((kind) => (
                        <div key={kind}>
                            <h3 className="mb-2 text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                                Cheapest missing {labels[kind].toLowerCase()}
                            </h3>
                            {collections.cheapest[kind].length === 0 ? (
                                <p className="text-xs text-[var(--ink-low)]">Nothing missing is on the trading post.</p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {collections.cheapest[kind].map((row) => (
                                        <li key={`${row.piece_id}-${row.item_id}`} className="flex items-center gap-2 text-xs">
                                            <GameIcon src={row.icon ?? row.item_icon} alt="" size="sm" />
                                            <span className="min-w-0 flex-1 truncate text-[var(--ink-mid)]">
                                                {row.item_name ?? row.name ?? `Item ${row.item_id}`}
                                            </span>
                                            <WikiLink wiki={row.wiki} name={row.item_name} compact />
                                            <span className="shrink-0 font-numeric text-[var(--ink-low)]">{coin(row.sell_unit)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                {collections.closest_titles.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                            Titles you are closest to
                        </h3>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {collections.closest_titles.map((t) => (
                                <li key={t.title_id} className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-[var(--ink-hi)]">{t.title}</span>
                                        <span className="truncate text-[var(--ink-faint)]">— {t.achievement}</span>
                                        <WikiLink wiki={t.wiki} name={t.achievement} compact />
                                        <span className="ml-auto shrink-0 font-numeric text-[var(--ink-low)]">
                                            {t.current}/{t.max}
                                        </span>
                                    </div>
                                    <Meter value={t.current} max={Math.max(1, t.max)} size="sm" />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="text-[11px] text-[var(--ink-faint)]">
                    Prices are per piece and never added up: most of a collection cannot be bought at all.
                    {collections.prices_observed_at &&
                        ` Trading post prices as of ${new Date(collections.prices_observed_at).toLocaleDateString()}.`}
                </p>
            </div>
        </Panel>
    );
}
