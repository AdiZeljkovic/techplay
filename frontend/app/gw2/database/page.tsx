import type { Metadata } from "next";
import Link from "next/link";
import { Hammer, Sparkles } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";
import { getCraftable, getPublicMasteries } from "@/lib/gw2public";

/**
 * The public half of the Guild Wars 2 tool.
 *
 * Everything under `/gw2/database` is the same for every player and needs no
 * key: recipes, mastery tracks, what a material goes into. Everything under
 * `/gw2` itself is somebody's own account and is `noindex`.
 *
 * Keeping the two apart by path rather than by page is deliberate. It makes the
 * robots story one line instead of a judgement per route, and it means a reader
 * who arrives from a search never lands on something that renders empty for them.
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
    title: "Guild Wars 2 Database — Crafting Recipes and Mastery Tracks",
    description:
        "Every craftable item in Guild Wars 2 broken down to the last material, and every mastery track with what each tier costs. No account needed.",
    keywords: [
        "guild wars 2 database",
        "gw2 crafting recipes",
        "gw2 mastery tracks",
        "gw2 crafting materials list",
    ],
    alternates: { canonical: "/gw2/database" },
};

export default async function Gw2DatabasePage() {
    const [craftable, masteries] = await Promise.all([getCraftable(1), getPublicMasteries()]);

    const trackCount = masteries?.reduce((sum, region) => sum + region.tracks.length, 0) ?? 0;

    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Guild Wars 2 database"
                description="Recipes broken down to the last material, and every mastery tier with what it costs. No account needed — connecting one just subtracts what you already have."
            />

            <Container className="py-8">
                <div className="grid gap-5 md:grid-cols-2">
                    <Panel material="lit" crown title="Crafting">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                {craftable
                                    ? `${craftable.total.toLocaleString()} craftable items, each one expanded to every material it needs and everything those need in turn.`
                                    : "Craftable items, each one expanded to every material it needs."}
                            </p>
                            <Link
                                href="/gw2/database/crafting"
                                className="inline-flex items-center gap-2 text-sm text-[var(--accent-ink)] hover:underline"
                            >
                                <Hammer size={15} aria-hidden />
                                Browse recipes
                            </Link>
                        </div>
                    </Panel>

                    <Panel material="instrument" title="Masteries">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                {trackCount > 0
                                    ? `${trackCount} tracks across ${masteries?.length} regions, with the point cost of every tier.`
                                    : "Every mastery track, with the point cost of every tier."}
                            </p>
                            <Link
                                href="/gw2/database/masteries"
                                className="inline-flex items-center gap-2 text-sm text-[var(--accent-ink)] hover:underline"
                            >
                                <Sparkles size={15} aria-hidden />
                                Browse masteries
                            </Link>
                        </div>
                    </Panel>
                </div>

                <Panel material="matte" title="Or bring your own account" className="mt-5">
                    <div className="space-y-3 text-sm text-[var(--ink-mid)]">
                        <p>
                            The same data, with your own progress against it: what you still need for a
                            recipe after your bank is counted, which mastery tiers your unspent points
                            already reach, and what is worth doing tonight.
                        </p>
                        <Link href="/gw2" className="inline-block text-[var(--accent-ink)] hover:underline">
                            Connect a Guild Wars 2 account →
                        </Link>
                    </div>
                </Panel>
            </Container>
        </div>
    );
}
