import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";
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

    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Mastery tracks"
                description={`Every track, every tier, and what each one costs — ${total} mastery points in all.`}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2/database" className="text-[var(--ink-low)] hover:text-[var(--accent-ink)]">
                        Guild Wars 2 database
                    </Link>
                </nav>

                <div className="space-y-5">
                    {regions.map((region) => (
                        <Panel
                            key={region.region}
                            material="matte"
                            title={region.region}
                            meta={
                                <span className="text-xs text-[var(--ink-faint)]">
                                    {region.tracks.length} tracks · {region.points_total} points
                                </span>
                            }
                        >
                            {/*
                             * One catalogue region has no counterpart in the
                             * endpoint that reports an account's points, so its
                             * tracks are shown under their own heading rather
                             * than filed under a guessed expansion.
                             */}
                            {!region.paired && (
                                <p className="mb-4 text-xs text-[var(--ink-low)]">
                                    The game groups these under{" "}
                                    <em>{region.catalogue_region}</em>, and its own account endpoint does not
                                    name a matching region — so we list them on their own rather than put
                                    them under an expansion we would be guessing at.
                                </p>
                            )}

                            <div className="space-y-5">
                                {region.tracks.map((track) => (
                                    <article key={track.id} className="space-y-2">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                            <h2 className="text-base text-[var(--ink-hi)]">{track.name}</h2>
                                            <span className="font-numeric text-xs text-[var(--ink-low)]">
                                                {track.tiers} tiers · {track.points_total} points
                                            </span>
                                        </div>

                                        {track.requirement && (
                                            <p className="text-sm text-[var(--ink-mid)]">{track.requirement}</p>
                                        )}

                                        <ol className="space-y-1">
                                            {track.levels.map((level, i) => (
                                                <li
                                                    key={`${track.id}-${i}`}
                                                    className="flex items-baseline gap-3 text-sm"
                                                >
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
                                                    <span className="shrink-0 font-numeric text-xs text-[var(--accent-ink)]">
                                                        {level.point_cost}
                                                    </span>
                                                </li>
                                            ))}
                                        </ol>
                                    </article>
                                ))}
                            </div>
                        </Panel>
                    ))}
                </div>

                <Panel material="instrument" title="With your own account" className="mt-5">
                    <p className="text-sm text-[var(--ink-mid)]">
                        Connect a Guild Wars 2 key and the same tracks show how far you are into each one,
                        and which tiers your unspent points already reach —{" "}
                        <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                            the advisor
                        </Link>
                        .
                    </p>
                </Panel>
            </Container>
        </div>
    );
}
