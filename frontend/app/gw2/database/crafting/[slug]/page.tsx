import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Hammer } from "lucide-react";
import Container from "@/components/ui/Container";
import Panel from "@/components/ui/Panel";
import { craftingHref, getPublicRecipe, itemIdFromSlug } from "@/lib/gw2public";
import type { PlanNode } from "@/lib/gw2";

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

    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
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
                    </div>
                </header>

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
                                        <li key={material.item_id} className="flex items-center gap-3">
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
                                            <Link
                                                href={craftingHref(material.item_id, material.slug)}
                                                className="min-w-0 flex-1 truncate text-sm text-[var(--ink-hi)] hover:text-[var(--accent-ink)]"
                                            >
                                                {material.name}
                                            </Link>
                                            <span className="shrink-0 font-numeric text-sm text-[var(--ink-low)]">
                                                ×{material.needed}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <p
                                    className="mt-4 border-t pt-3 text-xs text-[var(--ink-low)]"
                                    style={{ borderColor: "var(--line)" }}
                                >
                                    This is the whole tree with nothing subtracted.{" "}
                                    <Link href="/gw2/goals" className="text-[var(--accent-ink)] hover:underline">
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

                            {usedIn.length > 0 && (
                                <Panel material="matte" title="Used in">
                                    <ul className="space-y-2">
                                        {usedIn.map((used) => (
                                            <li key={used.id}>
                                                <Link
                                                    href={craftingHref(used.id, used.slug)}
                                                    className="flex items-center gap-2 text-sm text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
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
                                            </li>
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
                                <li key={used.id}>
                                    <Link
                                        href={craftingHref(used.id, used.slug)}
                                        className="flex items-center gap-2 text-sm text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
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
                                </li>
                            ))}
                        </ul>
                    </Panel>
                )}
            </Container>
        </div>
    );
}

/** One level of the tree. Server-rendered, so a crawler reads the whole thing. */
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
                    <Link
                        href={craftingHref(node.item_id, node.name ? slugify(node.name) : null)}
                        className="truncate text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                    >
                        {node.name ?? `#${node.item_id}`}
                    </Link>
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
