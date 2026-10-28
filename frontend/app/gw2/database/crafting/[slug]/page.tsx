import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Hammer } from "lucide-react";
import Container from "@/components/ui/Container";
import Panel from "@/components/ui/Panel";
import WikiLink from "@/components/gw2/WikiLink";
import { coin } from "@/lib/gw2format";
import { gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
import { craftingHref, getPublicRecipe, itemIdFromSlug } from "@/lib/gw2public";
import type { PlanNode, PublicRecipe } from "@/lib/gw2";

/**
 * What one craftable thing takes — for anyone, with no account.
 *
 * Server-rendered, and that is the requirement rather than a preference: this is
 * the page that brings people to the tool, and a crawler has no localStorage.
 * The same tree the signed-in planner draws, without the part that subtracts
 * your bank — and the page says so, with a link to the version that does.
 *
 * `used_in` at the bottom is not filler. Somebody looking up Deldrimor Steel
 * Ingot usually wants to know what it is for, and it is also what turns thirteen
 * thousand separate pages into a graph a crawler can walk.
 */
/*
 * A literal, not the shared constant.
 *
 * Next reads segment config at build time by statically analysing the module,
 * so `export const revalidate = SOMETHING_IMPORTED` is not a value it can see —
 * it fails the build with "Invalid segment configuration export detected" and
 * the route then 404s. The number has to be written here.
 *
 * 86400: a day. A game patch is the only thing that changes any of this, and
 * the API caches on the catalogue build underneath.
 */
export const revalidate = 86400;

/*
 * Nothing pre-rendered at build. There are 13,156 of these and they are a
 * reference, not a feed: the first reader of any one of them pays a few hundred
 * milliseconds and everyone after that is served from the cache until the game
 * patches. Building all of them would add half an hour to every deploy for
 * pages most of which nobody opens.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
    return [];
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const id = itemIdFromSlug(slug);
    const recipe = id ? await getPublicRecipe(id) : null;

    if (!recipe) {
        return { title: "Not found", robots: { index: false, follow: false } };
    }

    const { item, materials, requires } = recipe;

    const description = recipe.craftable
        ? `${item.name} takes ${materials.length} different materials to craft`
          + (requires ? `, and ${requires.disciplines.join(" or ")} at ${requires.min_rating}` : "")
          + ". Full breakdown, every tier of the tree."
        : `${item.name} is not crafted. See what it is used for and where it fits.`;

    return {
        title: `${item.name} — Guild Wars 2 crafting materials`,
        description,
        alternates: {
            // Always the id-and-slug form, whatever URL got here. Names are not
            // unique in this catalogue, so the id is the identity.
            canonical: craftingHref(item.id, item.slug),
        },
        /*
         * `follow` either way, and that is the point of the pair.
         *
         * A page outside the reviewed set is still worth crawling — its links
         * into the rest of the graph are how the reviewed pages get found — it
         * is simply not worth asking Google to rank. noindex without follow
         * would cut the graph; index on all thirteen thousand is the thing the
         * working document warns about twice.
         */
        robots: recipe.indexable ? { index: true, follow: true } : { index: false, follow: true },
        openGraph: {
            title: `${item.name} — what it takes to craft`,
            description,
            images: item.icon ? [{ url: item.icon }] : undefined,
        },
    };
}

export default async function CraftingPage({ params }: Params) {
    const { slug } = await params;
    const id = itemIdFromSlug(slug);
    const recipe = id ? await getPublicRecipe(id) : null;

    if (!recipe) {
        notFound();
    }

    const { item, materials, used_in: usedIn, requires } = recipe;

    const breadcrumb = gw2Breadcrumb([
        { name: "Guild Wars 2 database", path: "/gw2/database" },
        { name: "Crafting", path: "/gw2/database/crafting" },
        { name: item.name, path: craftingHref(item.id, item.slug) },
    ]);

    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
            <Container className="py-8">
                <nav className="mb-6 flex flex-wrap gap-x-2 text-sm text-[var(--ink-low)]">
                    <Link href="/gw2/database" className="hover:text-[var(--accent-ink)]">
                        Guild Wars 2 database
                    </Link>
                    <span aria-hidden>/</span>
                    <Link href="/gw2/database/crafting" className="hover:text-[var(--accent-ink)]">
                        Crafting
                    </Link>
                </nav>

                <header className="mb-6 flex items-start gap-4">
                    {item.icon && (
                        <Image
                            src={item.icon}
                            alt=""
                            width={64}
                            height={64}
                            unoptimized
                            className="h-16 w-16 shrink-0 rounded-[var(--radius-card)]"
                        />
                    )}
                    <div>
                        <h1 className="font-display text-3xl text-[var(--ink-hi)] text-balance">{item.name}</h1>
                        <p className="mt-1 text-sm text-[var(--ink-low)]">
                            {[item.rarity, item.type, item.level ? `level ${item.level}` : null]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                        <WikiLink wiki={item.wiki} name={item.name} className="mt-1 -ml-1" />
                    </div>
                </header>

                {recipe.prices?.item && (
                    <PriceLine
                        label="On the trading post"
                        sell={recipe.prices.item.sell_unit}
                        buy={recipe.prices.item.buy_unit}
                        observedAt={recipe.prices.observed_at}
                        stale={recipe.prices.stale}
                    />
                )}

                {!recipe.craftable ? (
                    <Panel material="matte">
                        <p className="text-sm text-[var(--ink-mid)]">
                            This is not crafted — it comes from a vendor, a drop or a reward track. What it
                            goes into is below.
                        </p>
                    </Panel>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-5">
                            <Panel material="lit" crown title="Everything it takes">
                                <ul className="space-y-2.5">
                                    {materials.map((material) => (
                                        <li
                                            key={material.currency_id ? `c${material.currency_id}` : material.item_id}
                                            className="flex items-center gap-3"
                                        >
                                            {material.icon && (
                                                <Image
                                                    src={material.icon}
                                                    alt=""
                                                    width={28}
                                                    height={28}
                                                    unoptimized
                                                    className="h-7 w-7 shrink-0 rounded-[var(--radius-inner)]"
                                                />
                                            )}
                                            {material.currency_id ? (
                                                <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink-hi)]">
                                                    {material.name}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={craftingHref(material.item_id, material.slug)}
                                                    className="min-w-0 flex-1 truncate text-sm text-[var(--ink-hi)] hover:text-[var(--accent-ink)]"
                                                >
                                                    {material.name}
                                                </Link>
                                            )}
                                            <WikiLink wiki={material.wiki} name={material.name} compact />
                                            <span className="shrink-0 font-numeric text-sm text-[var(--ink-low)]">
                                                ×{material.needed}
                                            </span>
                                            <span className="w-24 shrink-0 text-right font-numeric text-xs text-[var(--ink-faint)]">
                                                {(() => {
                                                    const unit = recipe.prices?.materials?.per_item[String(material.item_id)]?.sell_unit;
                                                    return unit != null ? coin(unit * material.needed) : "—";
                                                })()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {recipe.prices?.materials && (
                                    <div
                                        className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm"
                                        style={{ borderColor: "var(--line)" }}
                                    >
                                        <div>
                                            <div className="font-numeric text-[var(--ink-hi)]">
                                                {coin(recipe.prices.materials.buy_now)}
                                            </div>
                                            <div className="text-[11px] text-[var(--ink-low)]">materials, buying outright</div>
                                        </div>
                                        <div>
                                            <div className="font-numeric text-[var(--ink-mid)]">
                                                {coin(recipe.prices.materials.bid_and_wait)}
                                            </div>
                                            <div className="text-[11px] text-[var(--ink-low)]">bidding and waiting</div>
                                        </div>
                                        <p className="col-span-2 text-[11px] text-[var(--ink-faint)]">
                                            {recipe.prices.materials.not_tradable > 0 &&
                                                `${recipe.prices.materials.not_tradable} of these are not sold on the trading post and are not in the totals. `}
                                            {priceDate(recipe.prices.observed_at, recipe.prices.stale)}
                                        </p>
                                    </div>
                                )}

                                <p
                                    className="mt-4 border-t pt-3 text-xs text-[var(--ink-low)]"
                                    style={{ borderColor: "var(--line)" }}
                                >
                                    This is the whole tree with nothing subtracted.{" "}
                                    <Link href="/gw2/planner" className="text-[var(--accent-ink)] hover:underline">
                                        Connect your account
                                    </Link>{" "}
                                    and we take off what is already in your bank, your material storage and
                                    your characters&apos; bags.
                                </p>
                            </Panel>

                            <Panel material="matte" title="How it breaks down">
                                <Branch node={recipe.tree} />
                            </Panel>
                        </div>

                        <div className="space-y-5">
                            {requires && (
                                <Panel material="instrument" title="To make it yourself">
                                    <p className="text-sm text-[var(--ink-mid)]">
                                        {requires.disciplines.join(" or ")} at {requires.min_rating}.
                                    </p>
                                </Panel>
                            )}

                            {/* The game does not publish forge recipes, so this one says where it is from. */}
                            {recipe.forge && (
                                <Panel material="instrument" title="Made in the Mystic Forge">
                                    <p className="text-sm text-[var(--ink-mid)]">
                                        The game&apos;s API does not list Mystic Forge recipes. This one is from{" "}
                                        {recipe.forge.source_url ? (
                                            <a
                                                href={recipe.forge.source_url}
                                                target="_blank"
                                                rel="nofollow noopener noreferrer"
                                                className="text-[var(--accent-ink)] hover:underline"
                                            >
                                                {recipe.forge.source_label ?? "its source"}
                                            </a>
                                        ) : (
                                            "an editor's entry"
                                        )}
                                        {recipe.forge.checked_at &&
                                            `, checked ${new Date(recipe.forge.checked_at).toLocaleDateString()}`}
                                        .
                                    </p>
                                </Panel>
                            )}

                            {usedIn.length > 0 && (
                                <Panel material="matte" title="Used in">
                                    <ul className="space-y-2">
                                        {usedIn.map((used) => (
                                            <UsedInRow key={used.id} used={used} />
                                        ))}
                                    </ul>
                                </Panel>
                            )}
                        </div>
                    </div>
                )}

                {!recipe.craftable && usedIn.length > 0 && (
                    <Panel material="matte" title="Used in" className="mt-5">
                        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {usedIn.map((used) => (
                                <UsedInRow key={used.id} used={used} />
                            ))}
                        </ul>
                    </Panel>
                )}
            </Container>
        </div>
    );
}

/**
 * When the prices are from, and whether that is too long ago to trust.
 *
 * Read nightly. Past three days the read has failed at least twice, and the
 * page says so instead of presenting the number as today's.
 */
function priceDate(observedAt: string | null, stale: boolean): string {
    if (!observedAt) return "";

    const date = new Date(observedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    return stale ? `Prices from ${date} — more than three days old.` : `Trading post prices as of ${date}.`;
}

/** Both sides of the market: what it costs to have now, and to wait for. */
function PriceLine({
    label,
    sell,
    buy,
    observedAt,
    stale,
}: {
    label: string;
    sell: number | null;
    buy: number | null;
    observedAt: string | null;
    stale: boolean;
}) {
    return (
        <p className="-mt-2 mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--ink-mid)]">
            <span className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">{label}</span>
            {sell != null && (
                <span>
                    <strong className="font-numeric text-[var(--ink-hi)]">{coin(sell)}</strong> to buy now
                </span>
            )}
            {buy != null && (
                <span>
                    <strong className="font-numeric">{coin(buy)}</strong> highest bid
                </span>
            )}
            <span className="text-[11px] text-[var(--ink-faint)]">{priceDate(observedAt, stale)}</span>
        </p>
    );
}

/*
 * The wiki link sits beside our link, not inside it — an anchor in an anchor is
 * invalid HTML, and browsers repair it by splitting the row in two.
 */
function UsedInRow({ used }: { used: PublicRecipe["used_in"][number] }) {
    return (
        <li className="flex items-center gap-1">
            <Link
                href={craftingHref(used.id, used.slug)}
                className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
            >
                {used.icon && (
                    <Image
                        src={used.icon}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                        className="h-5 w-5 shrink-0 rounded-[var(--radius-inner)]"
                    />
                )}
                <span className="truncate">{used.name}</span>
            </Link>
            <WikiLink wiki={used.wiki} name={used.name} compact />
        </li>
    );
}

/*
 * One level of the tree. Server-rendered, so a crawler reads the whole thing.
 *
 * No wiki link per node: every node links to its own page here, which carries
 * one, and a legendary's tree runs to dozens of rows.
 */
function Branch({ node }: { node: PlanNode }) {
    return (
        <ul>
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
                    {node.currency_id ? (
                        <span className="truncate text-[var(--ink-mid)]">{node.name}</span>
                    ) : (
                        <Link
                            href={craftingHref(node.item_id, node.name ? slugify(node.name) : null)}
                            className="truncate text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                        >
                            {node.name ?? `#${node.item_id}`}
                        </Link>
                    )}
                    {node.forge && (
                        <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">
                            Mystic Forge{node.forge.random && " · average, the forge is random"}
                        </span>
                    )}
                    <span className="ml-auto shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                        ×{node.needed}
                    </span>
                </div>

                {node.children.map((child, i) => (
                    <Branch key={`${child.item_id}-${child.depth}-${i}`} node={child} />
                ))}
            </li>
        </ul>
    );
}

/** The tree carries names but not slugs; the id is what the route reads anyway. */
function slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
