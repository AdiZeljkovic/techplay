import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { HERO_ART } from "@/lib/gw2domain";
import { gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
import { getPublicInsights, insightHref } from "@/lib/gw2public";

/**
 * Every map with mastery insights, by expansion.
 *
 * Server-rendered from the mirrored `/v2/continents`, the only place the game
 * says where an insight is. The per-map pages carry the positions and the
 * nearest waypoint codes; this page is the index a reader and a crawler walk.
 */

// A literal: Next reads segment config statically. A day — only a game build
// changes any of this.
export const revalidate = 86400;

export const metadata: Metadata = {
    title: "Guild Wars 2 Mastery Insights — every map, with waypoint codes",
    description:
        "Every Mastery Insight in Guild Wars 2, map by map, with the nearest waypoint's chat code for each. From the game's own data.",
    alternates: { canonical: "/gw2/database/insights" },
};

export default async function InsightsIndexPage() {
    const regions = await getPublicInsights();

    if (!regions || regions.length === 0) {
        notFound();
    }

    const total = regions.reduce((sum, region) => sum + region.total, 0);

    return (
        <div className="tp-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLd(
                        gw2Breadcrumb([
                            { name: "Guild Wars 2 database", path: "/gw2/database" },
                            { name: "Mastery insights", path: "/gw2/database/insights" },
                        ])
                    ),
                }}
            />
            <Gw2Hero
                title="Mastery insights"
                description={`${total} insights across ${regions.reduce((n, r) => n + r.maps.length, 0)} maps, with the nearest waypoint to each.`}
                art={HERO_ART.masteries}
                back={{ href: "/gw2/database", label: "Guild Wars 2 database" }}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="min-w-0 space-y-4">
                    <SectionHeader
                        title="Maps by expansion"
                        description="Each map opens its insights in order, with the nearest waypoint to every one."
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        {regions.map((region) => (
                            <article
                                key={region.region}
                                className="rounded-[var(--radius-panel)] border"
                                style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
                            >
                                <header
                                    className="flex items-baseline justify-between gap-3 border-b px-5 py-3.5"
                                    style={{ borderColor: "var(--line)" }}
                                >
                                    <h3 className="font-display text-[17px] font-semibold text-[var(--ink-hi)]">{region.label}</h3>
                                    <span className="font-numeric text-xs text-[var(--ink-low)]">{region.total} insights</span>
                                </header>
                                <ul className="space-y-0.5 px-3 py-3">
                                    {region.maps.map((map) => (
                                        <li key={map.id}>
                                            <Link
                                                href={insightHref(map.id, map.slug)}
                                                className="flex justify-between gap-3 rounded-[var(--radius-card)] px-2 py-1.5 text-sm text-[var(--ink-mid)] transition-colors hover:bg-[var(--fill-1)] hover:text-[var(--ink-hi)]"
                                            >
                                                <span className="truncate">{map.name}</span>
                                                <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">{map.total}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="space-y-5">
                    <Gw2Panel title="Not the only source">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                Mastery points also come from achievements; this list is only the insights found on the
                                map.
                            </p>
                            <ActionLink href="/gw2/database/masteries">What each tier costs</ActionLink>
                        </div>
                    </Gw2Panel>

                    <Gw2Panel title="With your own account">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                Signed in with an account connected, each map page ticks off the insights you already
                                have and counts the ones still to collect.
                            </p>
                            <ActionLink href="/gw2">Connect an account</ActionLink>
                        </div>
                    </Gw2Panel>
                </div>
            </div>
        </div>
    );
}
