import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import HelpBreadcrumbs from "@/components/help/HelpBreadcrumbs";
import HelpHelpful from "@/components/help/HelpHelpful";
import StillNeedHelp from "@/components/help/StillNeedHelp";
import { DOC_PROSE } from "@/lib/prose";
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
        <div className="container-page py-8 md:py-12">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <HelpBreadcrumbs
                trail={[
                    { label: "Help centre", href: "/" },
                    { label: topic.name ?? "Topic", href: topic.slug ? `/${topic.slug}` : undefined },
                    { label: article.title },
                ]}
            />

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_260px] lg:gap-10 items-start">
                <article className="min-w-0">
                    <header>
                        <h1 className="font-display text-[26px] md:text-[34px] font-black leading-tight tracking-tight text-[var(--ink-hi)]">
                            {article.title}
                        </h1>

                        {reviewed && (
                            <p className="mt-3 text-[12px]" style={{ color: "var(--ink-low)" }}>
                                Last reviewed {reviewed}
                            </p>
                        )}
                    </header>

                    {/*
                      * The table rule is not decoration.
                      *
                      * DOC_PROSE was written for the legal documents, which
                      * have no tables; help answers do — the XP page is a
                      * table of what earns what, and a hardware answer will
                      * be worse. A `prose` table takes its natural width, so
                      * a wide one pushes the whole page sideways on a phone,
                      * and the reader loses the left edge of every line. This
                      * makes the table scroll inside itself instead.
                      */}
                    <div
                        className={`mt-6 ${DOC_PROSE} [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto`}
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />

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
                            {siblings.name}
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
    );
}
