import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidePersonalisation from "@/components/gw2/GuidePersonalisation";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import WikiLink from "@/components/gw2/WikiLink";
import { ActionLink, Gw2Panel } from "@/components/gw2/Gw2Ui";
import { domainTone, guideArt } from "@/lib/gw2domain";
import { gw2Breadcrumb, gw2GuideArticle, jsonLd } from "@/lib/gw2jsonld";
import { getGuide, guideFamily } from "@/lib/gw2public";
import { ARTICLE_PROSE } from "@/lib/prose";

/**
 * A public Guild Wars 2 guide.
 *
 * Server-rendered and indexed, and that ordering is the requirement rather than
 * a preference. §20 of the working document: *"The strongest acquisition model
 * is public, indexable guide pages that become personalized after account
 * connection. Private dashboards themselves do not rank."*
 *
 * So the substance is here, on the server, complete for a stranger and a
 * crawler. The account-aware part is one client island, and it renders an
 * invitation rather than a wall for a signed-out reader.
 *
 * Dynamic on the family too, which means this one file serves all nine families
 * §20.1 names. A static route under /gw2 wins over it, so the private tools at
 * /gw2/masteries and the database at /gw2/database are unaffected.
 */
export const revalidate = 3600;

type Params = { params: Promise<{ family: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { family, slug } = await params;
    const guide = await getGuide(family, slug);

    if (!guide) {
        return { title: "Not found", robots: { index: false, follow: false } };
    }

    return {
        title: guide.seo.title,
        description: guide.seo.description ?? undefined,
        keywords: guide.seo.keywords,
        alternates: { canonical: guide.path },
        openGraph: {
            title: guide.seo.title,
            description: guide.seo.description ?? undefined,
            type: "article",
            images: guide.hero_image ? [{ url: guide.hero_image }] : undefined,
        },
    };
}

export default async function Gw2GuidePage({ params }: Params) {
    const { family, slug } = await params;
    const guide = await getGuide(family, slug);

    if (!guide) {
        notFound();
    }

    const breadcrumb = gw2Breadcrumb([
        { name: "Guild Wars 2", path: "/gw2/database" },
        { name: guide.title, path: guide.path },
    ]);

    const { label, domain } = guideFamily(guide.family);
    // For the bars in the reader's own figures — the only colour on the page.
    const tone = domainTone(domain);
    const nextSteps = Object.entries(guide.next_steps ?? {});
    const sources = guide.sources ?? [];

    return (
        <div className="tp-page">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(gw2GuideArticle(guide)) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

            <Gw2Hero
                eyebrow={`Guild Wars 2 · ${label} guide`}
                title={guide.title}
                description={guide.standfirst ?? undefined}
                art={guideArt(guide.family)}
                back={{ href: "/gw2/guides", label: "All guides" }}
            >
                {guide.wiki && <WikiLink wiki={guide.wiki} name={guide.title} className="-ml-1" />}
            </Gw2Hero>

            {/*
             * Three cells, placed by the grid rather than by source order.
             *
             * The reader's own figures sit between the standfirst and the body
             * on a phone — high enough to be the reason somebody connects an
             * account, late enough that the page has already said what it is
             * about — and at the top of the right-hand column on a desktop.
             * Where to go next and the sources come after the body on a phone,
             * and under the figures on a desktop.
             *
             * The second row is `1fr` so the body, which spans both, does not
             * size the first: an auto row under a spanning item takes a share
             * of its height, and the sources would float halfway down the page.
             */}
            <div
                className={`grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start ${
                    guide.personalise_as ? "xl:grid-rows-[auto_1fr]" : ""
                }`}
            >
                {guide.personalise_as && (
                    <div className="xl:col-start-2 xl:row-start-1">
                        <GuidePersonalisation personaliseAs={guide.personalise_as} tone={tone} />
                    </div>
                )}

                <article
                    // The measure on the column rather than the prose: the prose
                    // carries `max-w-none`, and which of two max-widths wins
                    // would come down to stylesheet order.
                    className={`min-w-0 max-w-[68ch] xl:col-start-1 xl:row-start-1 ${guide.personalise_as ? "xl:row-span-2" : ""}`}
                >
                    {guide.body && (
                        <div
                            className={ARTICLE_PROSE}
                            // Written by the desk in the admin editor, not by a
                            // reader. Same trust boundary as every other
                            // staff-authored body on this site.
                            dangerouslySetInnerHTML={{ __html: guide.body }}
                        />
                    )}
                </article>

                {(nextSteps.length > 0 || sources.length > 0 || guide.reviewed_at) && (
                    <aside
                        className={`space-y-5 xl:col-start-2 ${guide.personalise_as ? "xl:row-start-2" : "xl:row-start-1"}`}
                    >
                        {nextSteps.length > 0 && (
                            <Gw2Panel title="Where to go next">
                                <nav aria-label="Where to go next">
                                    <ul className="space-y-2.5">
                                        {nextSteps.map(([stepLabel, href]) => (
                                            <li key={stepLabel}>
                                                <ActionLink href={href}>
                                                    {stepLabel}
                                                </ActionLink>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </Gw2Panel>
                        )}

                        {(sources.length > 0 || guide.reviewed_at) && (
                            <Gw2Panel
                                title="Sources"
                                description={sources.length > 0 ? "As recorded, checked or not" : undefined}
                            >
                                {/*
                                 * As recorded, unchecked ones included. A reader
                                 * deciding how far to trust this page gets the same
                                 * distinction an editor does.
                                 */}
                                {sources.length > 0 && (
                                    <ul className="space-y-2.5">
                                        {sources.map((source) => (
                                            <li key={source.label} className="text-sm">
                                                {source.url ? (
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="nofollow noopener noreferrer"
                                                        className="text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                                                    >
                                                        {source.label}
                                                    </a>
                                                ) : (
                                                    <span className="text-[var(--ink-mid)]">{source.label}</span>
                                                )}
                                                <span className="block text-[11px] text-[var(--ink-faint)]">
                                                    {source.kind_label} ·{" "}
                                                    {source.checked_at
                                                        ? `checked ${new Date(source.checked_at).toLocaleDateString()}`
                                                        : "not checked yet"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {guide.reviewed_at && (
                                    <p
                                        className={
                                            sources.length > 0
                                                ? "mt-4 border-t pt-3 text-[11px] text-[var(--ink-faint)]"
                                                : "text-[11px] text-[var(--ink-faint)]"
                                        }
                                        style={sources.length > 0 ? { borderColor: "var(--line)" } : undefined}
                                    >
                                        Last checked against the game on{" "}
                                        {new Date(guide.reviewed_at).toLocaleDateString()}.
                                    </p>
                                )}
                            </Gw2Panel>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}
