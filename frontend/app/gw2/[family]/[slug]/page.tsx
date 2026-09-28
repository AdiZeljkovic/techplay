import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import GuidePersonalisation from "@/components/gw2/GuidePersonalisation";
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

    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
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
