import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HelpBreadcrumbs from "@/components/help/HelpBreadcrumbs";
import HelpSearch from "@/components/help/HelpSearch";
import { searchHelp, SITE_URL } from "@/lib/help";
import { ROBOTS_NOINDEX } from "@/lib/seo";

/**
 * Results, rendered on the server like everything else here.
 *
 * `noindex`, and robots.txt keeps crawlers out of /search as well. Both,
 * because they answer different questions: the file stops the crawl, and the
 * tag handles a URL that reached the index some other way — somebody sharing a
 * results link, most likely. Search result pages are thin, endless and
 * duplicate the answers they point at, which is a category of page Google asks
 * not to be sent into.
 */
export const metadata: Metadata = {
    title: "Search",
    robots: ROBOTS_NOINDEX,
};

/** The query is different every time, so there is nothing here worth caching. */
export const dynamic = "force-dynamic";

export default async function HelpSearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string | string[] }>;
}) {
    const params = await searchParams;
    const raw = Array.isArray(params.q) ? params.q[0] : params.q;
    const query = (raw ?? "").trim();

    /*
     * There is no such thing as a search page without a search.
     *
     * Reached with nothing to look for — from the footer, a bookmark, an empty
     * form submission — this rendered a breadcrumb, a heading, an empty box
     * and "type at least two characters", with the footer floating at the
     * bottom of an otherwise blank screen. That is a page whose entire content
     * is an apology for existing.
     *
     * The index is the search page: it carries the same box, centred, with the
     * whole directory under it. So an empty search goes there instead, and the
     * route only ever renders when it has something to show.
     */
    if (query.length < 2) {
        redirect("/");
    }

    const results = await searchHelp(query);

    return (
        <div className="container-page py-8 md:py-12">
            <HelpBreadcrumbs trail={[{ label: "Help centre", href: "/" }, { label: "Search" }]} />

            <div className="mt-5 max-w-2xl">
                <h1 className="font-display text-[24px] md:text-[30px] font-black uppercase leading-tight tracking-tight text-[var(--ink-hi)]">
                    Search
                </h1>

                <div className="mt-4">
                    <HelpSearch defaultValue={query} />
                </div>
            </div>

            <div className="mt-8 max-w-3xl">
                {results.length > 0 ? (
                    <>
                        <p className="text-[12px]" style={{ color: "var(--ink-low)" }}>
                            {results.length} {results.length === 1 ? "answer" : "answers"} for “{query}”
                        </p>

                        <ul className="mt-4 space-y-2.5">
                            {results.map((answer) => (
                                <li key={answer.slug}>
                                    <a
                                        href={answer.url}
                                        className="block rounded-[var(--radius-panel)] border p-4 md:p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                        style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
                                    >
                                        {answer.topic_name && (
                                            <span
                                                className="block font-display text-[10px] font-black uppercase tracking-[0.14em]"
                                                style={{ color: "var(--accent)" }}
                                            >
                                                {answer.topic_name}
                                            </span>
                                        )}

                                        <span className="mt-1.5 block text-[14.5px] font-semibold leading-snug text-[var(--ink-hi)]">
                                            {answer.title}
                                        </span>

                                        {answer.excerpt && (
                                            <span className="mt-1.5 block text-[13px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                                                {answer.excerpt}
                                            </span>
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    /*
                     * Nothing found is the moment this section is most likely
                     * to lose somebody, so it is the one place that must not
                     * end in a shrug.
                     */
                    <section
                        className="rounded-[var(--radius-panel)] border px-5 py-8"
                        style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
                    >
                        <h2 className="font-display text-[14px] font-black uppercase tracking-[0.1em] text-[var(--ink-hi)]">
                            Nothing matched “{query}”
                        </h2>
                        <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                            Try fewer words, or the name of what you were doing — “steam library”,
                            “verification email”, “delete account”. If there is no answer written yet,
                            asking us is how one gets written.
                        </p>

                        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                            <a
                                href={`${SITE_URL}/contact?from=help&q=${encodeURIComponent(query)}`}
                                className="inline-flex items-center justify-center h-11 px-5 rounded-[var(--radius-inner)] font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                            >
                                Ask us
                            </a>
                            <a
                                href="/"
                                className="inline-flex items-center justify-center h-11 px-5 rounded-[var(--radius-inner)] border font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-[var(--ink-mid)] hover:text-[var(--ink-hi)] transition-colors"
                                style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                            >
                                Browse all topics
                            </a>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
