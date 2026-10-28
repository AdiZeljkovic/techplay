import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeyRound, Layers, ListTree } from "lucide-react";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import WikiLink from "@/components/gw2/WikiLink";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { DOMAIN_TONE, regionTone } from "@/lib/gw2domain";
import { gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
import { getPublicMasteries } from "@/lib/gw2public";

/**
 * Every mastery track, for anyone.
 *
 * The one part of this catalogue that needs no judgement about what to leave
 * out: forty tracks, complete, with the point cost of every tier and the
 * requirement text the game itself carries. It is also the answer to a question
 * people genuinely search for — "how many mastery points does Gliding cost" —
 * which nothing in the game itself answers in one place.
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

export const metadata: Metadata = {
    title: "Guild Wars 2 Mastery Tracks — Every Tier and What It Costs",
    description:
        "All Guild Wars 2 mastery tracks by region, with the mastery point cost of every tier. Central Tyria, Heart of Thorns, Path of Fire, Icebrood Saga, End of Dragons, Secrets of the Obscure and Janthir Wilds.",
    keywords: [
        "gw2 mastery points cost",
        "guild wars 2 mastery tracks",
        "gw2 gliding mastery",
        "gw2 how many mastery points",
        "gw2 mastery tiers",
    ],
    alternates: { canonical: "/gw2/database/masteries" },
};

export default async function PublicMasteriesPage() {
    const regions = await getPublicMasteries();

    if (!regions || regions.length === 0) {
        notFound();
    }

    const total = regions.reduce((sum, region) => sum + region.points_total, 0);

    const breadcrumb = gw2Breadcrumb([
        { name: "Guild Wars 2 database", path: "/gw2/database" },
        { name: "Mastery tracks", path: "/gw2/database/masteries" },
    ]);

    return (
        <div className="tp-page">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
            <Gw2Hero
                title="Mastery tracks"
                description={`Every track, every tier, and what each one costs — ${total} mastery points in all.`}
                tone={DOMAIN_TONE.masteries}
                back={{ href: "/gw2/database", label: "Guild Wars 2 database" }}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0 space-y-10">
                    {regions.map((region) => {
                        const tone = regionTone(region.region);

                        return (
                            <section key={region.region} id={anchor(region.region)} className="scroll-mt-24 space-y-4">
                                <SectionHeader
                                    icon={<Layers size={18} />}
                                    tone={tone}
                                    title={region.region}
                                    description={`${region.tracks.length} tracks · ${region.points_total} points`}
                                />

                                {/*
                                 * One catalogue region has no counterpart in the
                                 * endpoint that reports an account's points, so its
                                 * tracks are shown under their own heading rather
                                 * than filed under a guessed expansion.
                                 */}
                                {!region.paired && (
                                    <p className="text-xs text-[var(--ink-low)]">
                                        The game groups these under <em>{region.catalogue_region}</em>, and its own
                                        account endpoint does not name a matching region — so we list them on their own
                                        rather than put them under an expansion we would be guessing at.
                                    </p>
                                )}

                                <div className="grid gap-4 lg:grid-cols-2">
                                    {region.tracks.map((track) => (
                                        <article
                                            key={track.id}
                                            className="relative space-y-3 overflow-hidden rounded-[var(--radius-panel)] border p-4"
                                            style={{
                                                background: "var(--surface-1)",
                                                borderColor: `color-mix(in srgb, ${tone} 26%, var(--line))`,
                                            }}
                                        >
                                            <span
                                                aria-hidden
                                                className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
                                                style={{ background: tone }}
                                            />
                                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                                <div className="flex items-baseline gap-1.5">
                                                    {/* h3 now: the region above is the h2. */}
                                                    <h3 className="font-display text-base font-bold text-[var(--ink-hi)]">
                                                        {track.name}
                                                    </h3>
                                                    <WikiLink wiki={track.wiki} name={track.name} className="self-center" />
                                                </div>
                                                <span className="font-numeric text-xs text-[var(--ink-low)]">
                                                    {track.tiers} tiers · {track.points_total} points
                                                </span>
                                            </div>

                                            {track.requirement && (
                                                <p className="text-sm text-[var(--ink-mid)]">{track.requirement}</p>
                                            )}

                                            <ol className="space-y-1.5">
                                                {track.levels.map((level, i) => (
                                                    <li key={`${track.id}-${i}`} className="flex items-baseline gap-3 text-sm">
                                                        <span className="w-5 shrink-0 text-right font-numeric text-[11px] text-[var(--ink-faint)]">
                                                            {i + 1}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="text-[var(--ink-hi)]">{level.name}</span>
                                                            {level.description && (
                                                                <span className="block text-xs text-[var(--ink-low)]">
                                                                    {level.description}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span
                                                            className="shrink-0 rounded-full px-2 py-0.5 font-numeric text-[11px]"
                                                            style={{
                                                                color: tone,
                                                                background: `color-mix(in srgb, ${tone} 14%, transparent)`,
                                                            }}
                                                        >
                                                            {level.point_cost}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="space-y-5 xl:sticky xl:top-[88px] xl:self-start">
                    <Gw2Panel icon={<ListTree size={18} />} title="Regions" tone={DOMAIN_TONE.masteries}>
                        <ul className="space-y-1.5">
                            {regions.map((region) => (
                                <li key={region.region}>
                                    <a
                                        href={`#${anchor(region.region)}`}
                                        className="flex items-center justify-between gap-3 text-sm text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span
                                                aria-hidden
                                                className="h-2 w-2 shrink-0 rounded-full"
                                                style={{ background: regionTone(region.region) }}
                                            />
                                            <span className="truncate">{region.region}</span>
                                        </span>
                                        <span className="shrink-0 font-numeric text-xs text-[var(--ink-faint)]">
                                            {region.points_total}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Gw2Panel>

                    <Gw2Panel icon={<KeyRound size={18} />} title="With your own account">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                Connect a Guild Wars 2 key and the same tracks show how far you are into each one, and
                                which tiers your unspent points already reach.
                            </p>
                            <ActionLink href="/gw2" tone={DOMAIN_TONE.masteries}>
                                Open the advisor
                            </ActionLink>
                        </div>
                    </Gw2Panel>
                </div>
            </div>
        </div>
    );
}

/** An in-page anchor per region, for the list on the right. */
function anchor(region: string): string {
    return region.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
