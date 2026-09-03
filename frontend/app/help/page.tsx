import type { Metadata } from "next";
import { ArrowRight, LifeBuoy } from "lucide-react";
import HelpSearch from "@/components/help/HelpSearch";
import { generatePageMetadata, ROBOTS_NOINDEX } from "@/lib/seo";
import { getHelpIndex, HELP_URL, SITE_URL } from "@/lib/help";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    // The /help row in page_seo carries the canonical, and it points at this
    // hostname rather than at techplay.gg/help — the two are the same pages
    // and only one of them should be indexed.
    const base = await generatePageMetadata("/help", {
        title: "TechPlay Help Centre",
        description:
            "Answers to what we are asked most: sign-in trouble, connecting Steam, Xbox, PlayStation, GOG and Epic, how XP works, emails, and what happens to your data.",
    });

    /*
     * Indexable the moment it has something to say, and not a day before.
     *
     * The placeholder this page replaces was noindex on purpose, with a note
     * saying it becomes indexable in the commit that gives it content. The
     * content is written in the admin panel, not in a commit — so the switch
     * is made here instead, by the same condition: an index with no published
     * topics is an empty shell, and an empty shell that gets crawled is filed
     * as thin and remembered that way. This site spent eight days climbing out
     * of a hole with Google last week.
     *
     * The same fetch as the page body, so this costs nothing — Next dedupes
     * identical requests within one render.
     */
    const data = await getHelpIndex();

    return {
        ...base,
        robots: (data?.topics.length ?? 0) > 0 ? base.robots : ROBOTS_NOINDEX,
    };
}

/**
 * The front of the help centre.
 *
 * Search first, then everything, on one page. A help centre is a few dozen
 * answers — small enough that listing all of them beats making somebody guess
 * which of five categories their problem belongs to, and small enough that the
 * whole thing arrives in one cached API call.
 *
 * Every answer is a real link in the server-rendered HTML. That is the lesson
 * this site paid for two weeks ago: the author page fetches its articles in
 * the browser and ships zero links, so Googlebot has never seen one of them.
 * A help centre whose answers are only reachable after hydration is a help
 * centre that will never rank for the long-tail questions it was written for.
 */
export default async function HelpIndexPage() {
    const data = await getHelpIndex();
    const topics = data?.topics ?? [];
    const popular = data?.popular ?? [];

    const collection = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "TechPlay Help Centre",
        url: `${HELP_URL}/`,
        isPartOf: { "@type": "WebSite", name: "TechPlay", url: SITE_URL },
        hasPart: topics.map((topic) => ({
            "@type": "WebPage",
            name: topic.name,
            url: `${HELP_URL}/${topic.slug}`,
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }} />

            <section className="border-b" style={{ borderColor: "var(--line)" }}>
                <div className="container-page py-12 md:py-16">
                    <div className="max-w-2xl">
                        <h1 className="font-display text-[30px] md:text-[42px] font-black uppercase leading-[1.05] tracking-tight text-[var(--ink-hi)]">
                            How can we <span className="text-[var(--accent)]">help?</span>
                        </h1>
                        <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                            Written answers to the things that go wrong most. If none of them fits, the
                            bottom of every page reaches a person.
                        </p>

                        <div className="mt-6">
                            <HelpSearch />
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-page py-10 md:py-14">
                {popular.length > 0 && (
                    <section className="mb-12">
                        <h2 className="font-display text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--ink-low)" }}>
                            Read most
                        </h2>

                        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                            {popular.map((answer) => (
                                <li key={answer.slug}>
                                    <a
                                        href={answer.url}
                                        className="group flex items-center gap-3 rounded-[var(--radius-panel)] border px-4 py-3.5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                        style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
                                    >
                                        <span className="min-w-0 flex-1 text-[14px] font-medium text-[var(--ink-mid)] group-hover:text-[var(--ink-hi)] transition-colors">
                                            {answer.title}
                                        </span>
                                        <ArrowRight
                                            className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]"
                                            aria-hidden
                                        />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {topics.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {topics.map((topic) => (
                            <section
                                key={topic.slug}
                                className="rounded-[var(--radius-panel)] border p-5 md:p-6"
                                style={{
                                    background: "var(--surface-1)",
                                    borderColor: "var(--line-strong)",
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                                }}
                            >
                                <h2 className="font-display text-[15px] font-black uppercase tracking-[0.1em] text-[var(--ink-hi)]">
                                    <a href={`/${topic.slug}`} className="hover:text-[var(--accent)] transition-colors">
                                        {topic.name}
                                    </a>
                                </h2>

                                {topic.description && (
                                    <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                                        {topic.description}
                                    </p>
                                )}

                                <ul className="mt-4 space-y-1">
                                    {topic.articles.map((answer) => (
                                        <li key={answer.slug}>
                                            <a
                                                href={answer.url}
                                                className="block py-1.5 text-[13.5px] leading-snug transition-colors hover:text-[var(--accent)]"
                                                style={{ color: "var(--ink-mid)" }}
                                            >
                                                {answer.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                ) : (
                    /*
                     * Nothing published yet.
                     *
                     * The section ships before its writing does, and an index
                     * that renders as a blank page reads as a broken one. This
                     * says what is true and still gets the reader somewhere.
                     */
                    <section
                        className="rounded-[var(--radius-panel)] border px-6 py-10 text-center"
                        style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
                    >
                        <LifeBuoy className="mx-auto w-7 h-7 text-[var(--accent)]" aria-hidden />
                        <h2 className="mt-4 font-display text-[15px] font-black uppercase tracking-[0.1em] text-[var(--ink-hi)]">
                            The first answers are being written
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                            Nothing here yet. In the meantime, ask us directly — every question asked now
                            is one of the pages that ends up here.
                        </p>
                        <a
                            href={`${SITE_URL}/contact?from=help`}
                            className="mt-5 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-inner)] font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                        >
                            Ask us
                        </a>
                    </section>
                )}
            </div>
        </>
    );
}
