import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";
import { craftingHref, getCraftable, GW2_REVALIDATE } from "@/lib/gw2public";

/**
 * The index a crawler walks.
 *
 * Thirteen thousand recipe pages are only worth publishing if something links
 * to them, and paged links are how that happens without a page carrying
 * thirteen thousand anchors. Each recipe page also links to its own materials
 * and to what it is used in, so the set is a connected graph rather than a
 * list — which matters more for discovery than this page does.
 */
export const revalidate = GW2_REVALIDATE;

const PER_PAGE = 100;

type Search = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
    const { page } = await searchParams;
    const current = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

    return {
        title:
            current === 1
                ? "Guild Wars 2 Crafting Recipes — Every Material, Every Tier"
                : `Guild Wars 2 crafting recipes — page ${current}`,
        description:
            "Every craftable item in Guild Wars 2, each one broken down to the last material and everything those materials need in turn.",
        alternates: {
            canonical: current === 1 ? "/gw2/database/crafting" : `/gw2/database/crafting?page=${current}`,
        },
        // Deeper pages are for crawling, not for ranking: the value is on the
        // item pages they lead to, and a hundred near-identical index pages
        // competing with each other helps nobody.
        robots: current === 1 ? undefined : { index: false, follow: true },
    };
}

export default async function CraftingIndexPage({ searchParams }: Search) {
    const { page } = await searchParams;
    const current = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
    const data = await getCraftable(current);

    if (!data || data.items.length === 0) {
        notFound();
    }

    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Crafting recipes"
                description={`${data.total.toLocaleString()} craftable items, each one expanded to every material it needs.`}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2/database" className="text-[var(--ink-low)] hover:text-[var(--accent-ink)]">
                        Guild Wars 2 database
                    </Link>
                </nav>

                <Panel material="matte">
                    <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                        {data.items.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={craftingHref(item.id, item.slug)}
                                    className="flex items-center gap-2 py-1 text-sm text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                                >
                                    {item.icon && (
                                        <Image
                                            src={item.icon}
                                            alt=""
                                            width={20}
                                            height={20}
                                            unoptimized
                                            className="h-5 w-5 shrink-0 rounded-[var(--radius-inner)]"
                                        />
                                    )}
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>

                <nav className="mt-6 flex items-center justify-between gap-4 text-sm">
                    {current > 1 ? (
                        <Link
                            href={current === 2 ? "/gw2/database/crafting" : `/gw2/database/crafting?page=${current - 1}`}
                            className="text-[var(--accent-ink)] hover:underline"
                        >
                            ← Previous
                        </Link>
                    ) : (
                        <span />
                    )}

                    <span className="font-numeric text-xs text-[var(--ink-faint)]">
                        Page {current} of {data.pages} · {PER_PAGE} per page
                    </span>

                    {current < data.pages ? (
                        <Link
                            href={`/gw2/database/crafting?page=${current + 1}`}
                            className="text-[var(--accent-ink)] hover:underline"
                        >
                            Next →
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            </Container>
        </div>
    );
}
