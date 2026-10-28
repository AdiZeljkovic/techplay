import type { Metadata } from "next";
import { BookOpen, Database, Hammer, History, KeyRound, MapPin, Sparkles } from "lucide-react";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import ReferenceCard from "@/components/gw2/ReferenceCard";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { gw2Application, gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
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

const REFERENCE = DOMAIN_TONE.reference;

export default async function Gw2DatabasePage() {
    const [craftable, masteries] = await Promise.all([getCraftable(1), getPublicMasteries()]);

    const trackCount = masteries?.reduce((sum, region) => sum + region.tracks.length, 0) ?? 0;

    return (
        <div className="tp-page">
            {/* The tool's own page is noindex — it is somebody's account —
                so this public hub is where the tool is described. */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(gw2Application) }} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLd(gw2Breadcrumb([{ name: "Guild Wars 2 database", path: "/gw2/database" }])),
                }}
            />
            <Gw2Hero
                eyebrow="Guild Wars 2 reference"
                title="Guild Wars 2 database"
                description="Recipes broken down to the last material, and every mastery tier with what it costs. No account needed — connecting one just subtracts what you already have."
                tone={REFERENCE}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="min-w-0 space-y-4">
                    <SectionHeader
                        icon={<Database size={18} />}
                        tone={REFERENCE}
                        title="What is in it"
                        description="The same for every player, read from the game's own API and refreshed with each patch."
                    />

                    <ul className="grid gap-4 md:grid-cols-2">
                        <li>
                            <ReferenceCard
                                href="/gw2/database/crafting"
                                icon={<Hammer size={20} />}
                                tone={REFERENCE}
                                title="Crafting"
                                body={
                                    craftable
                                        ? `${craftable.total.toLocaleString()} craftable items, each one expanded to every material it needs and everything those need in turn.`
                                        : "Craftable items, each one expanded to every material it needs."
                                }
                                cta="Browse recipes"
                            />
                        </li>
                        <li>
                            <ReferenceCard
                                href="/gw2/database/masteries"
                                icon={<Sparkles size={20} />}
                                tone={DOMAIN_TONE.masteries}
                                title="Masteries"
                                body={
                                    trackCount > 0
                                        ? `${trackCount} tracks across ${masteries?.length} regions, with the point cost of every tier.`
                                        : "Every mastery track, with the point cost of every tier."
                                }
                                cta="Browse masteries"
                            />
                        </li>
                        <li>
                            <ReferenceCard
                                href="/gw2/database/insights"
                                icon={<MapPin size={20} />}
                                tone={DOMAIN_TONE.masteries}
                                title="Mastery insights"
                                body="Every insight on the map, map by map, with the nearest waypoint's chat code to travel there."
                                cta="Browse insights"
                            />
                        </li>
                        <li>
                            <ReferenceCard
                                href="/gw2/whats-new"
                                icon={<History size={20} />}
                                tone={DOMAIN_TONE.changes}
                                title="What changed"
                                body="Back after a break? The changes since 2023 that matter, dated, each with its source."
                                cta="What changed while you were away"
                            />
                        </li>
                    </ul>
                </section>

                <div className="space-y-5">
                    {/*
                     * Linked without a count. The guides list is cached for an
                     * hour and this page for a day; reading it here would pull
                     * the whole page down to the shorter of the two.
                     */}
                    <Gw2Panel
                        icon={<BookOpen size={18} />}
                        title="Guides"
                        description="Written by the desk, checked against the game"
                        tone={REFERENCE}
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                Level 80, fractals, masteries, mounts, the Wizard&apos;s Vault and your first
                                ascended set — each guide complete as it is, and showing your own figures once an
                                account is connected.
                            </p>
                            <ActionLink href="/gw2/guides" tone={REFERENCE}>
                                All guides
                            </ActionLink>
                        </div>
                    </Gw2Panel>

                    <Gw2Panel icon={<KeyRound size={18} />} title="Or bring your own account">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                The same data, with your own progress against it: what you still need for a recipe
                                after your bank is counted, which mastery tiers your unspent points already reach,
                                and what is worth doing tonight.
                            </p>
                            <ActionLink href="/gw2">Connect a Guild Wars 2 account</ActionLink>
                        </div>
                    </Gw2Panel>
                </div>
            </div>
        </div>
    );
}
