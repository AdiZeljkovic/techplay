import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hammer } from "lucide-react";
import GameIcon from "@/components/gw2/GameIcon";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import WikiLink from "@/components/gw2/WikiLink";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { HERO_ART } from "@/lib/gw2domain";
import { coin } from "@/lib/gw2format";
import { gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
import { craftingHref, getPublicRecipe, itemIdFromSlug } from "@/lib/gw2public";
import type { PlanNode, PublicMaterial, PublicRecipe } from "@/lib/gw2";

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

    const facts = [item.rarity, item.type, item.level ? `level ${item.level}` : null].filter(Boolean).join(" · ");

    return (
        <div className="tp-page">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

            <Gw2Hero
                eyebrow="Crafting recipe"
                title={item.name}
                description={facts || undefined}
                art={HERO_ART.crafting}
                back={{ href: "/gw2/database/crafting", label: "Crafting recipes" }}
            >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    {item.icon && <GameIcon src={item.icon} alt="" size="xl" rarity={item.rarity} />}

                    {recipe.prices?.item && (
                        <PriceLine
                            sell={recipe.prices.item.sell_unit}
                            buy={recipe.prices.item.buy_unit}
                            observedAt={recipe.prices.observed_at}
                            stale={recipe.prices.stale}
                        />
                    )}

                    <WikiLink wiki={item.wiki} name={item.name} />
                </div>
            </Gw2Hero>

            {!recipe.craftable ? (
                <div className="space-y-6">
                    <Gw2Panel title="Not crafted">
                        <p className="text-sm text-[var(--ink-mid)]">
                            This is not crafted — it comes from a vendor, a drop or a reward track. What it goes
                            into is below.
                        </p>
                    </Gw2Panel>

                    {usedIn.length > 0 && (
                        <section className="space-y-4">
                            <SectionHeader
                                title="Used in"
                                description={`${usedIn.length} ${usedIn.length === 1 ? "recipe takes" : "recipes take"} it.`}
                            />
                            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {usedIn.map((used) => (
                                    <UsedInRow key={used.id} used={used} boxed />
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0 space-y-6">
                        <section className="space-y-4">
                            <SectionHeader
                                title="Everything it takes"
                                description="Every raw material at the bottom of the tree, with nothing subtracted."
                            />

                            <ul className="grid gap-2.5 sm:grid-cols-2">
                                {materials.map((material) => (
                                    <li key={material.currency_id ? `c${material.currency_id}` : material.item_id}>
                                        <MaterialTile material={material} recipe={recipe} />
                                    </li>
                                ))}
                            </ul>

                            {recipe.prices?.materials && (
                                <div
                                    className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius-card)] border px-4 py-3"
                                    style={{ borderColor: "var(--line-strong)", background: "var(--surface-1)" }}
                                >
                                    <span>
                                        <span className="block text-[11px] text-[var(--ink-low)]">
                                            Materials, buying outright
                                        </span>
                                        <span className="font-numeric text-lg font-semibold text-[var(--ink-hi)]">
                                            {coin(recipe.prices.materials.buy_now)}
                                        </span>
                                        <span className="ml-2 text-xs text-[var(--ink-low)]">
                                            or {coin(recipe.prices.materials.bid_and_wait)} bidding and waiting
                                        </span>
                                    </span>
                                    <span className="text-[11px] text-[var(--ink-faint)]">
                                        {recipe.prices.materials.not_tradable > 0 &&
                                            `${recipe.prices.materials.not_tradable} of these are not sold on the trading post and are not in the totals. `}
                                        {priceDate(recipe.prices.observed_at, recipe.prices.stale)}
                                    </span>
                                </div>
                            )}
                        </section>

                        <section className="space-y-4">
                            <SectionHeader
                                title="How it breaks down"
                                description="The whole tree, tier by tier. Every line opens its own page."
                            />
                            <div
                                className="rounded-[var(--radius-panel)] border px-4 py-3"
                                style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
                            >
                                <Branch node={recipe.tree} />
                            </div>
                        </section>
                    </div>

                    <div className="space-y-5">
                        {requires && (
                            <Gw2Panel title="To make it yourself">
                                <p className="text-sm text-[var(--ink-mid)]">
                                    {requires.disciplines.join(" or ")} at {requires.min_rating}.
                                </p>
                            </Gw2Panel>
                        )}

                        {/* The game does not publish forge recipes, so this one says where it is from. */}
                        {recipe.forge && (
                            <Gw2Panel title="Made in the Mystic Forge">
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
                                        `, as of ${new Date(recipe.forge.checked_at).toLocaleDateString()}`}
                                    .
                                </p>
                            </Gw2Panel>
                        )}

                        <Gw2Panel title="With your own account">
                            <div className="space-y-4">
                                <p className="text-sm text-[var(--ink-mid)]">
                                    This is the whole tree with nothing subtracted. Connect your account and we take
                                    off what is already in your bank, your material storage and your characters&apos;
                                    bags.
                                </p>
                                <ActionLink href={`/gw2/planner?item=${item.id}`}>Plan it against your bank</ActionLink>
                            </div>
                        </Gw2Panel>

                        {usedIn.length > 0 && (
                            <Gw2Panel
                                title="Used in"
                                description={`${usedIn.length} ${usedIn.length === 1 ? "recipe takes" : "recipes take"} it`}
                            >
                                <ul className="space-y-2">
                                    {usedIn.map((used) => (
                                        <UsedInRow key={used.id} used={used} />
                                    ))}
                                </ul>
                            </Gw2Panel>
                        )}
                    </div>
                </div>
            )}
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
    sell,
    buy,
    observedAt,
    stale,
}: {
    sell: number | null;
    buy: number | null;
    observedAt: string | null;
    stale: boolean;
}) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--ink-low)]">On the trading post</p>
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--ink-mid)]">
                {sell != null && (
                    <span>
                        <strong className="font-numeric text-lg font-semibold text-[var(--ink-hi)]">{coin(sell)}</strong> to
                        buy now
                    </span>
                )}
                {buy != null && (
                    <span>
                        <strong className="font-numeric">{coin(buy)}</strong> highest bid
                    </span>
                )}
            </p>
            <p className="text-[11px] text-[var(--ink-faint)]">{priceDate(observedAt, stale)}</p>
        </div>
    );
}

/**
 * One material at the bottom of the tree: what it is, how many, and what that
 * many costs at the nightly price. A currency in a forge recipe has no page of
 * its own, so it is named rather than linked.
 */
function MaterialTile({ material, recipe }: { material: PublicMaterial; recipe: PublicRecipe }) {
    const unit = recipe.prices?.materials?.per_item[String(material.item_id)]?.sell_unit;

    return (
        <div
            className="flex h-full items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            {material.icon ? (
                <GameIcon src={material.icon} alt="" size="md" rarity={material.rarity} />
            ) : (
                <span aria-hidden className="h-9 w-9 shrink-0 rounded-[4px] bg-[var(--fill-2)]" />
            )}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                    {material.currency_id ? (
                        <span className="truncate text-[13px] text-[var(--ink-hi)]">{material.name}</span>
                    ) : (
                        <Link
                            href={craftingHref(material.item_id, material.slug)}
                            className="truncate text-[13px] text-[var(--ink-hi)] hover:text-[var(--accent-ink)]"
                        >
                            {material.name}
                        </Link>
                    )}
                    <WikiLink wiki={material.wiki} name={material.name} compact />
                </div>
                <p className="mt-0.5 flex justify-between gap-2 text-[11px]">
                    <span className="font-numeric text-[var(--ink-mid)]">×{material.needed}</span>
                    <span className="font-numeric text-[var(--ink-faint)]">
                        {unit != null ? coin(unit * material.needed) : "—"}
                    </span>
                </p>
            </div>
        </div>
    );
}

/*
 * The wiki link sits beside our link, not inside it — an anchor in an anchor is
 * invalid HTML, and browsers repair it by splitting the row in two.
 */
function UsedInRow({ used, boxed = false }: { used: PublicRecipe["used_in"][number]; boxed?: boolean }) {
    return (
        <li
            className={boxed ? "flex items-center gap-1 rounded-[var(--radius-card)] border px-3 py-2" : "flex items-center gap-1"}
            style={boxed ? { background: "var(--surface-1)", borderColor: "var(--line-strong)" } : undefined}
        >
            <Link
                href={craftingHref(used.id, used.slug)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-sm text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
            >
                {used.icon ? (
                    <GameIcon src={used.icon} alt="" size="sm" rarity={used.rarity} />
                ) : (
                    <span aria-hidden className="h-6 w-6 shrink-0 rounded-[4px] bg-[var(--fill-2)]" />
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
                    {/* Marks a node that is crafted in turn, not a raw material. */}
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
                    {/* A forge step credits its source: the game does not publish these. */}
                    {node.forge && (
                        <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">
                            Mystic Forge{node.forge.random && " · average, the forge is random"}
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
