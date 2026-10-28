import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import { DOMAIN_TONE } from "@/lib/gw2domain";
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
                tone={DOMAIN_TONE.masteries}
                back={{ href: "/gw2/database", label: "Guild Wars 2 database" }}
            />

            <div>
                <div className="grid gap-5 md:grid-cols-2">
                    {regions.map((region) => (
                        <Panel
                            key={region.region}
                            material="matte"
                            title={region.label}
                            meta={<span className="font-numeric text-xs text-[var(--ink-faint)]">{region.total} insights</span>}
                        >
                            <ul className="space-y-1.5">
                                {region.maps.map((map) => (
                                    <li key={map.id} className="flex justify-between gap-3 text-sm">
                                        <Link
                                            href={insightHref(map.id, map.slug)}
                                            className="text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                                        >
                                            {map.name}
                                        </Link>
                                        <span className="font-numeric text-xs text-[var(--ink-low)]">{map.total}</span>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ))}
                </div>

                <p className="mt-6 text-xs text-[var(--ink-faint)]">
                    Mastery points also come from achievements; this list is only the insights found on the map.
                </p>
            </div>
        </div>
    );
}
