import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import HelpBreadcrumbs from "@/components/help/HelpBreadcrumbs";
import HelpSearch from "@/components/help/HelpSearch";
import { getHelpTopic, HELP_URL } from "@/lib/help";
import { ROBOTS_INDEX } from "@/lib/seo";

export const revalidate = 3600;

interface Props {
    params: Promise<{ topic: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { topic: slug } = await params;
    const topic = await getHelpTopic(slug);

    if (!topic) return { title: "Not found", robots: { index: false, follow: false } };

    const description =
        topic.description ?? `Answers about ${topic.name.toLowerCase()} on TechPlay.`;

    return {
        title: topic.name,
        description,
        robots: ROBOTS_INDEX,
        alternates: { canonical: `${HELP_URL}/${topic.slug}` },
        openGraph: {
            title: `${topic.name} | TechPlay Help`,
            description,
            url: `${HELP_URL}/${topic.slug}`,
            type: "website",
        },
    };
}

/**
 * One topic, and everything filed under it.
 *
 * The list is the page — no pagination, no "load more". A topic holds a
 * handful of answers, and every one of them is a link in the HTML that reaches
 * the crawler, which is the whole reason this section is server rendered.
 *
 * A hidden topic is a 404 here rather than an empty page. That is the API's
 * decision, not this file's: `HelpArticle::scopeVisible()` treats hiding a
 * topic as withdrawing everything inside it, so the endpoint answers 404 and
 * `fetchContent` turns that into null.
 */
export default async function HelpTopicPage({ params }: Props) {
    const { topic: slug } = await params;
    const topic = await getHelpTopic(slug);

    if (!topic) notFound();

    return (
        <div className="container-page py-8 md:py-12">
            <HelpBreadcrumbs trail={[{ label: "Help centre", href: "/" }, { label: topic.name }]} />

            <header className="mt-5 max-w-2xl">
                <h1 className="font-display text-[26px] md:text-[34px] font-black uppercase leading-tight tracking-tight text-[var(--ink-hi)]">
                    {topic.name}
                </h1>

                {topic.description && (
                    <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                        {topic.description}
                    </p>
                )}
            </header>

            {topic.articles.length > 0 ? (
                <ul className="mt-8 grid gap-2.5 lg:grid-cols-2">
                    {topic.articles.map((answer) => (
                        <li key={answer.slug}>
                            <a
                                href={answer.url}
                                className="group flex h-full items-start gap-3 rounded-[var(--radius-panel)] border p-4 md:p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                style={{
                                    background: "var(--surface-1)",
                                    borderColor: "var(--line)",
                                }}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[14.5px] font-semibold leading-snug text-[var(--ink-hi)]">
                                        {answer.title}
                                    </span>
                                    {answer.excerpt && (
                                        <span
                                            className="mt-1.5 block text-[13px] leading-relaxed"
                                            style={{ color: "var(--ink-low)" }}
                                        >
                                            {answer.excerpt}
                                        </span>
                                    )}
                                </span>

                                <ArrowRight
                                    className="mt-0.5 w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]"
                                    aria-hidden
                                />
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-8 text-[13.5px]" style={{ color: "var(--ink-low)" }}>
                    Nothing published under this topic yet.
                </p>
            )}

            <div className="mt-12 max-w-xl">
                <h2 className="font-display text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--ink-low)" }}>
                    Not what you were after?
                </h2>
                <div className="mt-3">
                    <HelpSearch size="sm" />
                </div>
            </div>
        </div>
    );
}
