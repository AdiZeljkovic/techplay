import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import HelpBreadcrumbs from "@/components/help/HelpBreadcrumbs";
import HelpHelpful from "@/components/help/HelpHelpful";
import StillNeedHelp from "@/components/help/StillNeedHelp";
import { HELP_PROSE } from "@/lib/prose";
import { fetchSiteSettings, ROBOTS_INDEX, ROBOTS_NOINDEX } from "@/lib/seo";
import { getHelpAnswer, getHelpTopic, HELP_URL, reviewedOn, SITE_URL } from "@/lib/help";

export const revalidate = 3600;

const DISCORD_FALLBACK = "https://discord.gg/wPQG9gUMXH";

interface Props {
    params: Promise<{ topic: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getHelpAnswer(slug);

    if (!data) return { title: "Not found", robots: ROBOTS_NOINDEX };

    const { article, topic } = data;
    const title = article.seo_title || article.title;
    const description =
        article.seo_description || article.excerpt || `How to fix this on TechPlay.`;
    // The canonical is always the topic the answer actually belongs to, never
    // the one in the address bar — see the redirect in the page below.
    const canonical = `${HELP_URL}/${topic.slug}/${article.slug}`;

    return {
        title,
        description,
        robots: article.is_noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX,
        alternates: { canonical },
        openGraph: { title, description, url: canonical, type: "article" },
    };
}

/**
 * One answer.
 *
 * ── The redirect at the top, and why it is not paranoia ─────────────────
 *
 * An answer's slug is unique across the whole help centre, not just inside its
 * topic — deliberately, so that moving an answer between topics never 404s the
 * links already out in the world. The cost of that decision is that the topic
 * segment in the URL is decoration: the API finds this answer from the slug
 * alone, so /anything/steam-library-is-not-syncing would render it too.
 *
 * Left alone, that is an unbounded set of URLs serving identical content, and
 * a crawler that finds one of them indexes a page we never meant to publish.
 * So a request whose topic segment does not match where the answer actually
 * files is answered with a 308 to the address that does — the same treatment
 * /news/{slug} got for tech articles last week, and for the same reason.
 */
export default async function HelpAnswerPage({ params }: Props) {
    const { topic: topicSlug, slug } = await params;

    const [data, settings] = await Promise.all([getHelpAnswer(slug), fetchSiteSettings()]);

    if (!data) notFound();

    const { article, topic, related } = data;

    if (topic.slug && topic.slug !== topicSlug) {
        permanentRedirect(`/${topic.slug}/${article.slug}`);
    }

    // The topic's other answers, as a sidebar. Two jobs: somebody whose
    // problem turned out to be the next one along finds it without going back,
    // and every answer in a topic ends up linked from every other one, which
    // is the internal linking a section of this size otherwise has none of.
    const siblings = await getHelpTopic(topic.slug ?? topicSlug);
    const reviewed = reviewedOn(article.updated_at);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.seo_description || article.excerpt || undefined,
        datePublished: article.published_at || undefined,
        dateModified: article.updated_at || article.published_at || undefined,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${HELP_URL}${article.url}` },
        // No byline, on purpose. Help copy is institutional — a name on it
        // invites "ask that person", which is the support burden this section
        // exists to remove.
        publisher: {
            "@type": "Organization",
            name: "TechPlay",
            url: SITE_URL,
        },
    };

    return (
        /*
         * Held to a reading width.
         *
         * `container-page` is 1500px, and this laid an article across all of it
         * minus the sidebar — a line of running text about 1,100 pixels long,
         * which is roughly 130 characters. Somewhere past 75 the eye stops
         * finding the start of the next line reliably and a page stops looking
         * set at all; it reads as text sprayed onto a background, which is
         * exactly what it looked like.
         *
         * 940px for the whole thing puts the column at about 75 characters and
         * leaves the sidebar within reach of it instead of stranded at the far
         * edge of a widescreen monitor.
         */
        <div className="container-page py-8 md:py-12">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="mx-auto max-w-[940px]">

            <HelpBreadcrumbs
                trail={[
                    { label: "Help centre", href: "/" },
                    { label: topic.name ?? "Topic", href: topic.slug ? `/${topic.slug}` : undefined },
                    { label: article.title },
                ]}
            />

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_212px] lg:gap-10 items-start">
                <article className="min-w-0">
                    {/* One surface, the way the legal documents already do it.
                        Body text loose on the page background is what made this
                        read as unformatted next to an index made of cards. */}
                    <div
                        className="rounded-[var(--radius-panel)] border p-5 md:p-7"
                        style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
                    >
                    <header className="border-b pb-6" style={{ borderColor: "var(--line)" }}>
                        {/* The topic, above the title and linked. A reader who
                            arrived from Google has no idea what else is here,
                            and the breadcrumb above is too quiet to tell them. */}
                        {topic.name && topic.slug && (
                            <a
                                href={`/${topic.slug}`}
                                className="font-display text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                            >
                                {topic.name}
                            </a>
                        )}

                        <h1 className="mt-2.5 font-display text-[26px] md:text-[34px] font-black leading-[1.15] tracking-tight text-[var(--ink-hi)]">
                            {article.title}
                        </h1>

                        {/* The summary was written for every answer and was
                            only ever used in listings — so the page that most
                            needs to say "yes, this is the one" opened without
                            it, and the reader had to read a paragraph to find
                            out whether they were in the right place. */}
                        {article.excerpt && (
                            <p className="mt-3.5 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                                {article.excerpt}
                            </p>
                        )}

                        {reviewed && (
                            <p className="mt-5 font-display text-[10.5px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--ink-low)" }}>
                                Last reviewed {reviewed}
                            </p>
                        )}
                    </header>

                    <div
                        className={`mt-7 ${HELP_PROSE}`}
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                    </div>

                    <HelpHelpful slug={article.slug} />

                    <StillNeedHelp
                        slug={article.slug}
                        discordUrl={settings.discord_url || DISCORD_FALLBACK}
                        // Both, or nothing. The switch on its own would render
                        // a chat button with nowhere to go, and an address on
                        // its own would open a chat nobody is watching.
                        liveChatUrl={
                            ["1", "true"].includes(String(settings.help_livechat_enabled)) && settings.help_livechat_url
                                ? String(settings.help_livechat_url)
                                : null
                        }
                    />

                    {related.length > 0 && (
                        <section className="mt-10">
                            <h2 className="font-display text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--ink-low)" }}>
                                Related
                            </h2>
                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {related.map((answer) => (
                                    <li key={answer.slug}>
                                        <a
                                            href={answer.url}
                                            className="block rounded-[var(--radius-panel)] border px-4 py-3 text-[13.5px] leading-snug transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[var(--ink-hi)]"
                                            style={{ background: "var(--surface-1)", borderColor: "var(--line)", color: "var(--ink-mid)" }}
                                        >
                                            {answer.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </article>

                {siblings && siblings.articles.length > 1 && (
                    <aside className="lg:sticky lg:top-20">
                        <h2 className="font-display text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--ink-low)" }}>
                            More in {siblings.name}
                        </h2>

                        <ul className="mt-3 space-y-0.5 border-l" style={{ borderColor: "var(--line-strong)" }}>
                            {siblings.articles.map((answer) => {
                                const here = answer.slug === article.slug;

                                return (
                                    <li key={answer.slug}>
                                        <a
                                            href={answer.url}
                                            aria-current={here ? "page" : undefined}
                                            className={`block -ml-px border-l-2 pl-3.5 py-1.5 text-[13px] leading-snug transition-colors ${
                                                here
                                                    ? "border-[var(--accent)] text-[var(--ink-hi)] font-medium"
                                                    : "border-transparent hover:text-[var(--ink-hi)]"
                                            }`}
                                            style={here ? undefined : { color: "var(--ink-low)" }}
                                        >
                                            {answer.title}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </aside>
                )}
            </div>
            </div>
        </div>
    );
}
