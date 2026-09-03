import type { Metadata } from "next";
import { ArrowRight, LifeBuoy } from "lucide-react";
import HelpSearch from "@/components/help/HelpSearch";
import TopicIcon from "@/components/help/TopicIcon";
import { generatePageMetadata, ROBOTS_NOINDEX } from "@/lib/seo";
import { getHelpIndex, HELP_URL, SITE_URL } from "@/lib/help";

export const revalidate = 3600;

/** How many answers a card lists before it defers to the topic page. */
const PREVIEW = 4;

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
 * ── The layout, and the version of it that was wrong ────────────────────
 *
 * The first one set the heading and the search box in a narrow left column
 * with the right half of the screen empty, then listed every answer of every
 * topic in a two-column grid of plain boxes. Two things were wrong with it,
 * and neither was cosmetic.
 *
 * The search box was where the reader was not looking. A help centre is a
 * search box with a directory underneath — that is the whole shape of the
 * thing — and putting it off to one side hides the one control that answers
 * most visits.
 *
 * And the directory had no hierarchy. Eleven answers under one topic and one
 * under another, drawn as identical rows in a grid whose rows align to the
 * tallest card, produced a page that was half empty boxes and gave the eye
 * nothing to land on: no marks, no counts, every link the same weight.
 *
 * So: the search is centred and given room, and each topic shows its mark, its
 * name, what it covers, and the first few answers — then hands off to its own
 * page. Cards stay close in height because the list is capped, and the topic
 * with eleven answers no longer decides how tall the topic with one is.
 *
 * ── What that costs, and why it is affordable ───────────────────────────
 *
 * Roughly forty links in the HTML instead of forty-eight. Crawlers still reach
 * every answer: the sitemap lists all sixty-one URLs, and each topic page
 * server-renders its full list. This is one extra hop, not a dead end — which
 * is the thing the author page actually got wrong, where the links exist only
 * after hydration and Googlebot has never seen one.
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

            {/* ─────────────────────────────────────────────── the search */}
            <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--line)" }}>
                {/* A single accent bloom behind the heading. The page is a
                    directory and should stay quiet; this is the one place it
                    is allowed to have a temperature. */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(62% 130% at 50% -10%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 68%)",
                    }}
                />

                <div className="relative container-page py-16 md:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="font-display text-[32px] md:text-[46px] font-black uppercase leading-[1.02] tracking-tight text-[var(--ink-hi)]">
                            How can we <span className="text-[var(--accent)]">help?</span>
                        </h1>

                        <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                            Written answers to the things that go wrong most. If none of them fits, the
                            bottom of every page reaches a person.
                        </p>

                        <div className="mt-7">
                            <HelpSearch />
                        </div>

                        {popular.length > 0 && (
                            /* Inline, not a grid of boxes. These are a shortcut
                               under the search field, and drawing them as cards
                               made them compete with the topics below for the
                               same attention. */
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[12.5px]">
                                <span className="font-display text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--ink-low)" }}>
                                    Read most
                                </span>

                                {popular.slice(0, 4).map((answer) => (
                                    <a
                                        key={answer.slug}
                                        href={answer.url}
                                        className="rounded-full border px-3 py-1.5 transition-colors hover:text-[var(--ink-hi)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                        style={{
                                            background: "var(--surface-1)",
                                            borderColor: "var(--line-strong)",
                                            color: "var(--ink-mid)",
                                        }}
                                    >
                                        {answer.title}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ────────────────────────────────────────────── the directory */}
            <div className="container-page py-12 md:py-16">
                {topics.length > 0 ? (
                    <>
                        <h2 className="font-display text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--ink-low)" }}>
                            Browse by topic
                        </h2>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {topics.map((topic) => {
                                const shown = topic.articles.slice(0, PREVIEW);
                                const rest = topic.articles.length - shown.length;

                                return (
                                    <section
                                        key={topic.slug}
                                        className="flex flex-col rounded-[var(--radius-panel)] border p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                                        style={{
                                            background: "var(--surface-1)",
                                            borderColor: "var(--line-strong)",
                                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-inner)] text-[var(--accent)]"
                                                style={{
                                                    background: "var(--accent-soft)",
                                                    border: "1px solid color-mix(in srgb, var(--accent) 26%, transparent)",
                                                }}
                                            >
                                                <TopicIcon icon={topic.icon} />
                                            </span>

                                            <div className="min-w-0">
                                                <h3 className="font-display text-[13.5px] font-black uppercase leading-tight tracking-[0.08em] text-[var(--ink-hi)]">
                                                    <a href={`/${topic.slug}`} className="hover:text-[var(--accent)] transition-colors">
                                                        {topic.name}
                                                    </a>
                                                </h3>

                                                {topic.description && (
                                                    <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: "var(--ink-low)" }}>
                                                        {topic.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <ul className="mt-4 space-y-px border-t pt-3" style={{ borderColor: "var(--line)" }}>
                                            {shown.map((answer) => (
                                                <li key={answer.slug}>
                                                    <a
                                                        href={answer.url}
                                                        className="group flex items-start gap-2 py-1.5 text-[13px] leading-snug transition-colors hover:text-[var(--accent)]"
                                                        style={{ color: "var(--ink-mid)" }}
                                                    >
                                                        <ArrowRight
                                                            className="mt-[3px] h-3 w-3 shrink-0 opacity-30 transition-opacity group-hover:opacity-100"
                                                            aria-hidden
                                                        />
                                                        <span className="min-w-0">{answer.title}</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Pushed to the bottom so the link sits
                                            on the card's edge whatever the row
                                            height turns out to be. */}
                                        <a
                                            href={`/${topic.slug}`}
                                            className="mt-auto pt-3 font-display text-[10.5px] font-black uppercase tracking-[0.12em] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                                        >
                                            {rest > 0 ? `All ${topic.articles.length} answers →` : "Open topic →"}
                                        </a>
                                    </section>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    /*
                     * Nothing published yet.
                     *
                     * The section ships before its writing does, and an index
                     * that renders as a blank page reads as a broken one. This
                     * says what is true and still gets the reader somewhere.
                     */
                    <section
                        className="mx-auto max-w-lg rounded-[var(--radius-panel)] border px-6 py-10 text-center"
                        style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
                    >
                        <LifeBuoy className="mx-auto h-7 w-7 text-[var(--accent)]" aria-hidden />
                        <h2 className="mt-4 font-display text-[15px] font-black uppercase tracking-[0.1em] text-[var(--ink-hi)]">
                            The first answers are being written
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                            Nothing here yet. In the meantime, ask us directly — every question asked now
                            is one of the pages that ends up here.
                        </p>
                        <a
                            href={`${SITE_URL}/contact?from=help`}
                            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-[var(--accent)] px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--accent-hover)]"
                        >
                            Ask us
                        </a>
                    </section>
                )}
            </div>
        </>
    );
}
