import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import InsightList from "@/components/gw2/InsightList";
import { HERO_ART } from "@/lib/gw2domain";
import { gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
import { getPublicInsightMap, insightHref } from "@/lib/gw2public";

/**
 * One map's mastery insights. Server-rendered for anybody; a signed-in reader's
 * own ticks are added by the client island (`InsightList`).
 */

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
    return [];
}

type Params = { params: Promise<{ map: string }> };

function mapId(param: string): number | null {
    const id = Number.parseInt(param, 10);

    return Number.isFinite(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { map } = await params;
    const id = mapId(map);
    const data = id ? await getPublicInsightMap(id) : null;

    if (!data) {
        return { title: "Not found", robots: { index: false, follow: false } };
    }

    return {
        title: `${data.name} mastery insights — Guild Wars 2`,
        description: `All ${data.insights_total} Mastery Insights in ${data.name}, with the nearest waypoint's chat code for each.`,
        alternates: { canonical: insightHref(data.id, data.slug) },
    };
}

export default async function InsightMapPage({ params }: Params) {
    const { map } = await params;
    const id = mapId(map);
    const data = id ? await getPublicInsightMap(id) : null;

    if (!data) {
        notFound();
    }

    return (
        <div className="tp-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLd(
                        gw2Breadcrumb([
                            { name: "Guild Wars 2 database", path: "/gw2/database" },
                            { name: "Mastery insights", path: "/gw2/database/insights" },
                            { name: data.name, path: insightHref(data.id, data.slug) },
                        ])
                    ),
                }}
            />
            <Gw2Hero
                eyebrow="Mastery insights"
                title={data.name}
                description={
                    [data.region, data.min_level && data.max_level ? `level ${data.min_level}–${data.max_level}` : null]
                        .filter(Boolean)
                        .join(" · ") || undefined
                }
                art={HERO_ART.masteries}
                back={{ href: "/gw2/database/insights", label: "Mastery insights" }}
            />

            <InsightList map={data} />
        </div>
    );
}
