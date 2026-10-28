import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameIcon, { RARITY_COLOUR } from "@/components/gw2/GameIcon";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import { SectionHeader } from "@/components/gw2/Gw2Ui";
import { HERO_ART } from "@/lib/gw2domain";
import { craftingHref, getCraftable } from "@/lib/gw2public";

/**
 * The index a crawler walks.
 *
 * Thirteen thousand recipe pages are only worth publishing if something links
 * to them, and paged links are how that happens without a page carrying
 * thirteen thousand anchors. Each recipe page also links to its own materials
 * and to what it is used in, so the set is a connected graph rather than a
 * list — which matters more for discovery than this page does.
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
        <div className="tp-page">
            <Gw2Hero
                eyebrow="Guild Wars 2 reference"
                title="Crafting recipes"
                description={`${data.total.toLocaleString()} craftable items, each one expanded to every material it needs.`}
                art={HERO_ART.crafting}
                back={{ href: "/gw2/database", label: "Guild Wars 2 database" }}
            />

            <section className="space-y-4">
                <SectionHeader
                    title={current === 1 ? "Every craftable item" : `Page ${current}`}
                    description="Framed in the game's own rarity colours. Each one opens the full tree."
                    meta={
                        <span className="font-numeric text-xs text-[var(--ink-faint)]">
                            Page {current} of {data.pages} · {PER_PAGE} per page
                        </span>
                    }
                />

                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.items.map((item) => (
                        <li key={item.id}>
                            <Link
                                href={craftingHref(item.id, item.slug)}
                                className="group flex h-full items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2 transition-colors hover:bg-[var(--fill-1)]"
                                style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
                            >
                                {item.icon ? (
                                    <GameIcon src={item.icon} alt="" size="md" rarity={item.rarity} />
                                ) : (
                                    <span aria-hidden className="h-9 w-9 shrink-0 rounded-[4px] bg-[var(--fill-2)]" />
                                )}
                                <span className="min-w-0">
                                    <span className="block truncate text-sm text-[var(--ink-hi)] group-hover:text-[var(--accent-ink)]">
                                        {item.name}
                                    </span>
                                    <span className="block truncate text-[11px] text-[var(--ink-faint)]">
                                        {item.rarity && (
                                            <span style={{ color: RARITY_COLOUR[item.rarity] ?? undefined }}>{item.rarity}</span>
                                        )}
                                        {item.rarity && item.type && " · "}
                                        {item.type}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-4 text-sm">
                {current > 1 ? (
                    <PageLink href={current === 2 ? "/gw2/database/crafting" : `/gw2/database/crafting?page=${current - 1}`}>
                        <ChevronLeft size={14} aria-hidden />
                        Previous
                    </PageLink>
                ) : (
                    <span />
                )}

                <span className="font-numeric text-xs text-[var(--ink-faint)]">
                    Page {current} of {data.pages}
                </span>

                {current < data.pages ? (
                    <PageLink href={`/gw2/database/crafting?page=${current + 1}`}>
                        Next
                        <ChevronRight size={14} aria-hidden />
                    </PageLink>
                ) : (
                    <span />
                )}
            </nav>
        </div>
    );
}

/** Previous and next, as a quiet button rather than a bare text link. */
function PageLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--fill-1)] px-4 text-[13px] text-[var(--ink-hi)] transition-colors hover:bg-[var(--fill-3)]"
        >
            {children}
        </Link>
    );
}
