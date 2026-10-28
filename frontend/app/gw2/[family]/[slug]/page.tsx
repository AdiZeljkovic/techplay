import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import GuidePersonalisation from "@/components/gw2/GuidePersonalisation";
import WikiLink from "@/components/gw2/WikiLink";
import { gw2Breadcrumb, gw2GuideArticle, jsonLd } from "@/lib/gw2jsonld";
import { getGuide } from "@/lib/gw2public";
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
 * crawler. The account-aware part is one client island below the standfirst,
 * and it renders nothing for a signed-out reader — no login wall, no empty box.
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

    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(gw2GuideArticle(guide)) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
            <Container className="py-10">
                <article className="mx-auto max-w-[68ch]">
                    <nav className="mb-6 text-sm">
                        <Link href="/gw2/database" className="text-[var(--ink-low)] hover:text-[var(--accent-ink)]">
                            Guild Wars 2
                        </Link>
                    </nav>

                    <h1 className="font-display text-3xl leading-tight text-[var(--ink-hi)] text-balance sm:text-4xl">
                        {guide.title}
                    </h1>

                    {guide.standfirst && (
                        <p className="mt-3 text-lg leading-relaxed text-[var(--ink-mid)]">{guide.standfirst}</p>
                    )}

                    <WikiLink wiki={guide.wiki} name={guide.title} className="mt-2 -ml-1" />

                    {/*
                     * The reader's own figures, between the standfirst and the
                     * body. High enough to be the reason somebody connects an
                     * account, and late enough that the page has already said
                     * what it is about.
                     */}
                    {guide.personalise_as && <GuidePersonalisation personaliseAs={guide.personalise_as} />}

                    {guide.body && (
                        <div
                            className={ARTICLE_PROSE}
                            // Written by the desk in the admin editor, not by a
                            // reader. Same trust boundary as every other
                            // staff-authored body on this site.
                            dangerouslySetInnerHTML={{ __html: guide.body }}
                        />
                    )}

                    {guide.next_steps && Object.keys(guide.next_steps).length > 0 && (
                        <nav
                            className="mt-10 border-t pt-6"
                            style={{ borderColor: "var(--line)" }}
                            aria-label="Where to go next"
                        >
                            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">
                                Next
                            </h2>
                            <ul className="space-y-2">
                                {Object.entries(guide.next_steps).map(([label, href]) => (
                                    <li key={label}>
                                        <Link
                                            href={href}
                                            className="text-sm text-[var(--accent-ink)] hover:underline"
                                        >
                                            {label} →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {guide.sources && guide.sources.length > 0 && (
                        <section
                            className="mt-10 border-t pt-6"
                            style={{ borderColor: "var(--line)" }}
                            aria-labelledby="guide-sources"
                        >
                            <h2
                                id="guide-sources"
                                className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]"
                            >
                                Sources
                            </h2>
                            {/*
                             * As recorded, unchecked ones included. A reader
                             * deciding how far to trust this page gets the same
                             * distinction an editor does.
                             */}
                            <ul className="space-y-2">
                                {guide.sources.map((source) => (
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
                        </section>
                    )}

                    {guide.reviewed_at && (
                        <p className="mt-8 text-[11px] text-[var(--ink-faint)]">
                            Last checked against the game on{" "}
                            {new Date(guide.reviewed_at).toLocaleDateString()}.
                        </p>
                    )}
                </article>
            </Container>
        </div>
    );
}
