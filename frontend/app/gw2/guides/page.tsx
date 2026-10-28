import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import ReferenceCard from "@/components/gw2/ReferenceCard";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { HERO_ART } from "@/lib/gw2domain";
import { gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
import { GUIDE_FAMILIES, getGuides, guideFamily, type PublicGuideSummary } from "@/lib/gw2public";

/**
 * Every published Guild Wars 2 guide, by family.
 *
 * The guides are the acquisition half of the tool (§20 of the working
 * document): public pages that read complete for a stranger and personalise
 * after a key is connected. Until now nothing listed them — each was reachable
 * from the sitemap and from wherever another page happened to link it, and a
 * reader who finished one had no way to the next but the back button.
 *
 * Server-rendered and indexed, like the guides themselves.
 */

// A literal: Next reads segment config statically. An hour, the same as the
// guides — a newly published one should not wait a day to be listed.
export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Guild Wars 2 Guides — Fractals, Masteries, Mounts and Legendaries",
    description:
        "Guild Wars 2 guides from TechPlay: Agony Resistance and fractals, masteries, mounts, the Wizard's Vault, legendaries and your first ascended set. Each one shows your own progress once an account is connected.",
    keywords: [
        "guild wars 2 guides",
        "gw2 guide",
        "gw2 agony resistance guide",
        "gw2 mastery guide",
        "gw2 mount guide",
        "gw2 legendary guide",
    ],
    alternates: { canonical: "/gw2/guides" },
    openGraph: {
        title: "Guild Wars 2 Guides",
        description:
            "Fractals, masteries, mounts, the Wizard's Vault, legendaries and your first ascended set — each guide complete as it is, and personal once an account is connected.",
        type: "website",
    },
};

export default async function Gw2GuidesPage() {
    const guides = await getGuides();

    if (!guides || guides.length === 0) {
        notFound();
    }

    const families = byFamily(guides);

    return (
        <div className="tp-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLd(gw2Breadcrumb([{ name: "Guild Wars 2 guides", path: "/gw2/guides" }])),
                }}
            />

            <Gw2Hero
                eyebrow="Guild Wars 2 reference"
                title="Guides"
                description={`${guides.length} ${guides.length === 1 ? "guide" : "guides"}, each complete as it is. Connect an account and the ones that can show your own figures do.`}
                art={HERO_ART.guides}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0 space-y-10">
                    {families.map(({ family, guides: list }) => {
                        const { label } = guideFamily(family);

                        return (
                            <section key={family} id={family} className="scroll-mt-24 space-y-4">
                                <SectionHeader
                                    title={label}
                                    description={`${list.length} ${list.length === 1 ? "guide" : "guides"}`}
                                />

                                <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                    {list.map((guide) => (
                                        <li key={guide.path}>
                                            <ReferenceCard
                                                href={guide.path}
                                                eyebrow={label}
                                                title={guide.title}
                                                body={guide.standfirst}
                                                cta="Read the guide"
                                                image={usableImage(guide.hero_image)}
                                                meta={guide.updated_at ? `Updated ${shortDate(guide.updated_at)}` : undefined}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>

                <div className="space-y-5 xl:sticky xl:top-[88px] xl:self-start">
                    <Gw2Panel title="Families">
                        <ul className="space-y-1.5">
                            {families.map(({ family, guides: list }) => (
                                <li key={family}>
                                    <a
                                        href={`#${family}`}
                                        className="flex items-center justify-between gap-3 text-sm text-[var(--ink-mid)] hover:text-[var(--ink-hi)]"
                                    >
                                        <span className="min-w-0 truncate">{guideFamily(family).label}</span>
                                        <span className="shrink-0 font-numeric text-xs text-[var(--ink-faint)]">
                                            {list.length}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Gw2Panel>

                    <Gw2Panel title="With your own account">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--ink-mid)]">
                                Connect a Guild Wars 2 key and a guide shows where you stand — your Agony Resistance,
                                your mastery points, which ascended slots are still to fill.
                            </p>
                            <ActionLink href="/gw2">Connect an account</ActionLink>
                        </div>
                    </Gw2Panel>
                </div>
            </div>
        </div>
    );
}

/**
 * Guides grouped by family, the families in the admin's order and the guides
 * in the order the API returns them — the desk's own `sort_order`. A family
 * the frontend has not heard of yet still gets its section, after the rest.
 */
function byFamily(guides: PublicGuideSummary[]): { family: string; guides: PublicGuideSummary[] }[] {
    const groups = new Map<string, PublicGuideSummary[]>();

    for (const guide of guides) {
        groups.set(guide.family, [...(groups.get(guide.family) ?? []), guide]);
    }

    const order = Object.keys(GUIDE_FAMILIES);
    const rank = (family: string) => (order.includes(family) ? order.indexOf(family) : order.length);

    return [...groups.entries()]
        .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
        .map(([family, list]) => ({ family, guides: list }));
}

/**
 * The image field is free text in the admin. A full URL or a path on this site
 * can be drawn; anything else — a bare file name, a storage key — would be a
 * broken picture, so the card goes without.
 */
function usableImage(src: string | null): string | null {
    return src && (/^https?:\/\//.test(src) || src.startsWith("/")) ? src : null;
}

function shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
