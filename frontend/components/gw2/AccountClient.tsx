"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, HelpCircle, Minus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Meter from "@/components/ui/Meter";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import ConnectionPanel from "@/components/gw2/ConnectionPanel";
import { useGw2Shell } from "@/components/gw2/Gw2Shell";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { Gw2Card, PageSummary, SummaryFact } from "@/components/gw2/Gw2PageParts";
import { DOMAIN_TONE } from "@/lib/gw2domain";
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
 * Every section is null when the key cannot see it, and says which permission
 * that is rather than drawing an empty shelf.
 *
 * A summary across the top, each part its own section of plain cards, and the
 * connection and its history down the right, where the dashboard used to keep
 * them. Colour is in the collection bars and the owned/unknown/not-owned marks,
 * and nowhere else.
 */

const COLLECTIONS = DOMAIN_TONE.achievements;

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
            <Gw2Panel title="Connect your account first">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        This page is read from your own Guild Wars 2 account.
                    </p>
                    <Button asChild>
                        <Link href="/gw2">Go to the advisor</Link>
                    </Button>
                </div>
            </Gw2Panel>
        );
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-8">
                <Summary data={data} connection={connection} />
                <Ownership products={data.ownership} />
                <Armory armory={data.legendary_armory} />
                <TradingPost tp={data.trading_post} />
                <Collections collections={data.collections} />
            </div>

            {(connection || data.history) && (
                <div className="space-y-5">
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
        </div>
    );
}

/**
 * The account at a glance: one figure from each part below, so the reader
 * sees what is here before scrolling for it. Each one is the same number its
 * section shows, never a total across them.
 */
function Summary({ data, connection }: { data: Gw2AccountOverview; connection: Gw2Connection | null }) {
    const read = connection?.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : null;

    return (
        <PageSummary
            title={connection?.account_name ?? "Your account"}
            description={read ? `From your last read, ${read}.` : "From your last read."}
        >
            <dl className="grid gap-4 sm:grid-cols-3">
                <SummaryFact
                    value={data.legendary_armory ? `${data.legendary_armory.owned_count} / ${data.legendary_armory.in_catalogue}` : "—"}
                    label={data.legendary_armory ? "legendaries in the armory" : "armory not shared"}
                />
                <SummaryFact
                    value={
                        data.collections
                            ? `${data.collections.counts.skins.have} / ${data.collections.counts.skins.total}`
                            : "—"
                    }
                    label={data.collections ? "wardrobe skins" : "collections not shared"}
                />
                <SummaryFact
                    value={data.trading_post ? coin(data.trading_post.waiting.coins) : "—"}
                    label={data.trading_post ? "waiting at the trading post" : "trading post not shared"}
                />
            </dl>
        </PageSummary>
    );
}

/** What a key without the permission shows instead of a section's contents. */
function Unshared({ children }: { children: React.ReactNode }) {
    return (
        <p
            className="rounded-[var(--radius-card)] border px-4 py-3 text-sm text-[var(--ink-low)]"
            style={{ borderColor: "var(--line)", background: "var(--surface-1)" }}
        >
            {children}
        </p>
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
        <Gw2Panel title="Since you connected" description="What changed between our reads">
            {history.events.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">Nothing has changed between reads yet.</p>
            ) : (
                <ul className="space-y-2">
                    {history.events.slice(0, 8).map((event, i) => (
                        <li key={`${event.type}-${event.id}-${i}`} className="flex gap-2 text-sm">
                            <Check size={14} className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden />
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
        </Gw2Panel>
    );
}

const OWNED_LOOK = {
    yes: { tone: "var(--success)", icon: <Check size={15} /> },
    unknown: { tone: "var(--warning)", icon: <HelpCircle size={15} /> },
    no: { tone: "var(--ink-faint)", icon: <Minus size={15} /> },
} as const;

function Ownership({ products }: { products: Gw2OwnedProduct[] }) {
    const came = products.filter((p) => p.owned && (p.how === "included" || (p.how === "free" && p.kind === "living_world")));

    return (
        <section className="space-y-4">
            <SectionHeader
                title="What you own"
                description="What the game reports, what came with it, and what it does not say."
            />

            {came.length > 0 && (
                <p className="text-sm text-[var(--ink-mid)]">
                    Since 13 October 2026 these come with what you have, or are free:{" "}
                    <span className="text-[var(--ink-hi)]">{came.map((p) => p.name).join(", ")}</span>.
                </p>
            )}

            <ul className="grid gap-3 md:grid-cols-2">
                {products.map((product) => {
                    const look = product.owned === true ? OWNED_LOOK.yes : product.owned === null ? OWNED_LOOK.unknown : OWNED_LOOK.no;

                    return (
                        <li key={product.key}>
                            <Gw2Card className="flex h-full gap-3">
                                <span aria-hidden className="mt-0.5 shrink-0" style={{ color: look.tone }}>
                                    {look.icon}
                                </span>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                        <span
                                            className="font-display text-[15px] font-semibold"
                                            style={{ color: product.owned ? "var(--ink-hi)" : "var(--ink-low)" }}
                                        >
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
                            </Gw2Card>
                        </li>
                    );
                })}
            </ul>
        </section>
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

function Armory({ armory }: { armory: Gw2AccountOverview["legendary_armory"] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Legendary armory"
                description={
                    armory
                        ? `${armory.owned_count} of ${armory.in_catalogue} — and how many of each the armory can use.`
                        : "Every legendary you hold, shared across your characters."
                }
                action={{ href: "/gw2/legendary", label: "Every legendary" }}
            />

            {!armory ? (
                <Unshared>
                    Your key does not include the <strong>unlocks</strong> permission, or we have not read it yet.
                </Unshared>
            ) : armory.owned.length === 0 ? (
                <Unshared>
                    No legendaries in the armory yet.{" "}
                    <Link href="/gw2/legendary" className="text-[var(--accent-ink)] hover:underline">
                        See what each one takes
                    </Link>
                    .
                </Unshared>
            ) : (
                <>
                    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {armory.owned.map((item) => (
                            <li key={item.item_id}>
                                <Gw2Card className="flex h-full items-center gap-3 px-3 py-2.5">
                                    <GameIcon src={item.icon} alt="" size="md" rarity="Legendary" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                            <span className="truncate text-[13px] text-[var(--ink-hi)]">
                                                {item.name ?? `Item ${item.item_id}`}
                                            </span>
                                            <WikiLink wiki={item.wiki} name={item.name} compact />
                                        </div>
                                        <p className="font-numeric text-[11px] text-[var(--ink-low)]">
                                            {item.count}
                                            {item.max_count !== null && ` / ${item.max_count}`}
                                            {item.type && <span className="ml-1.5 text-[var(--ink-faint)]">{item.type}</span>}
                                        </p>
                                    </div>
                                </Gw2Card>
                            </li>
                        ))}
                    </ul>
                    <p className="text-[11px] text-[var(--ink-faint)]">
                        The second figure is how many the armory can use — rings and accessories take two, some weapons
                        more.
                    </p>
                </>
            )}
        </section>
    );
}

function TradingPost({ tp }: { tp: Gw2AccountOverview["trading_post"] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Trading post"
                description="What is waiting at the counter, and what your orders hold."
            />

            {!tp ? (
                <Unshared>
                    Your key does not include the <strong>tradingpost</strong> permission, or we have not read it yet.
                </Unshared>
            ) : (
                <Gw2Card className="space-y-4 p-5">
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <TpFigure value={coin(tp.waiting.coins)} label="waiting at the counter" strong />
                        <TpFigure value={String(tp.waiting.items.length)} label="item stacks waiting" />
                        <TpFigure value={coin(tp.in_buy_orders)} label={`held in ${tp.buys.length} buy orders`} />
                        <TpFigure
                            value={coin(tp.listed_for)}
                            label={`listed in ${tp.sells.length} sell orders, before the trading post's cut`}
                        />
                    </dl>

                    {tp.waiting.items.length > 0 && (
                        <ul
                            className="grid grid-cols-1 gap-x-4 gap-y-1.5 border-t pt-3 sm:grid-cols-2"
                            style={{ borderColor: "var(--line)" }}
                        >
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

                    {/* No undercut warning: our prices are read once a night, and
                        a warning built on them would be wrong most of the day. */}
                    <p className="border-t pt-3 text-[11px] text-[var(--ink-faint)]" style={{ borderColor: "var(--line)" }}>
                        We do not say whether you have been undercut — our prices are from last night, and the market
                        moves faster than that.
                    </p>
                </Gw2Card>
            )}
        </section>
    );
}

function TpFigure({ value, label, strong = false }: { value: string; label: string; strong?: boolean }) {
    return (
        <div className="min-w-0">
            <dt className="sr-only">{label}</dt>
            <dd
                className="font-numeric text-lg leading-tight"
                style={{ color: strong ? "var(--ink-hi)" : "var(--ink-mid)" }}
            >
                {value}
            </dd>
            <dd className="text-[11px] text-[var(--ink-low)]">{label}</dd>
        </div>
    );
}

function Collections({ collections }: { collections: Gw2AccountOverview["collections"] }) {
    const labels = { skins: "Wardrobe skins", minis: "Miniatures", outfits: "Outfits", titles: "Titles" } as const;

    return (
        <section className="space-y-4">
            <SectionHeader
                title="Collections"
                description="How much of each you have, the cheapest missing pieces, and the titles nearest to hand."
            />

            {!collections ? (
                <Unshared>
                    Your key does not include the <strong>unlocks</strong> permission, or we have not read your
                    collections yet. They arrive with the next full read.
                </Unshared>
            ) : (
                <div className="space-y-5">
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
                            <li key={key}>
                                <Gw2Card className="h-full space-y-2">
                                    <p className="text-xs text-[var(--ink-low)]">{labels[key]}</p>
                                    <p className="font-numeric text-lg font-semibold leading-tight text-[var(--ink-hi)]">
                                        {collections.counts[key].have}
                                        <span className="text-xs font-normal text-[var(--ink-low)]">
                                            {" "}
                                            / {collections.counts[key].total}
                                        </span>
                                    </p>
                                    <Meter
                                        value={collections.counts[key].have}
                                        max={Math.max(1, collections.counts[key].total)}
                                        size="sm"
                                        tone={COLLECTIONS}
                                    />
                                </Gw2Card>
                            </li>
                        ))}
                    </ul>

                    <div className="grid gap-3 lg:grid-cols-3">
                        {(["skins", "minis", "outfits"] as const).map((kind) => (
                            <Gw2Card key={kind} className="space-y-2.5">
                                <h3 className="text-[13px] font-semibold text-[var(--ink-hi)]">
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
                            </Gw2Card>
                        ))}
                    </div>

                    {collections.closest_titles.length > 0 && (
                        <div className="space-y-2.5">
                            <h3 className="text-[13px] font-semibold text-[var(--ink-hi)]">Titles you are closest to</h3>
                            <ul className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
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
                                        <Meter value={t.current} max={Math.max(1, t.max)} size="sm" tone={COLLECTIONS} />
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
            )}
        </section>
    );
}
