"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import type { FeedItem } from "@/types/feed";

/** Filter value → the category.type the API groups on, and where "all" lands. */
const FILTERS = [
    { id: "all", label: "All", href: "/news" },
    { id: "news", label: "News", href: "/news" },
    { id: "reviews", label: "Reviews", href: "/reviews" },
    { id: "tech", label: "Tech", href: "/hardware" },
    { id: "guides", label: "Guides", href: "/guides" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

// The feed answers with { items, meta } so it can be paged; this strip only
// ever wants the first handful.
const fetcher = (url: string) =>
    axios.get(url).then((r) => (r.data?.data?.items ?? []) as FeedItem[]);

/**
 * The portal's date format for a compact card: "13 Aug 2026". The feed used
 * to print "Aug 13" while every other list on the site printed the long form,
 * which is the kind of difference nobody names and everybody feels.
 */
function publishedLabel(iso?: string | null): string {
    if (!iso) return "";

    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * One article, drawn exactly as RecommendedNews draws one.
 *
 * This row had its own thumbnail size, its own title weight and its own date
 * format — close enough to the portal's compact card to look like a mistake
 * rather than a variant. The measurements below are that card's, not new ones:
 * a 96×64 frame at the site's card radius, an accent kicker over a black
 * headline, and the date underneath rather than beside the category.
 */
function Row({ article, index }: { article: FeedItem; index: number }) {
    return (
        <Link
            href={article.url}
            className={`group flex items-stretch gap-3 h-full p-2.5 rounded-[var(--radius-card)] hover:bg-white/[0.03] transition-colors duration-300 tp-fade-up tp-d${Math.min(6, index + 1)}`}
        >
            {/* The art matches the column beside it rather than sitting at a
                fixed 64px while a two-line headline and a date grew past it.
                Fixed width, stretched height: the row decides how tall it is,
                and the picture agrees with it. */}
            <span className="relative w-[104px] shrink-0 self-stretch min-h-[72px] rounded-[var(--radius-card)] overflow-hidden border border-white/[0.06] bg-black/40">
                {article.featured_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={article.featured_image_url}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                    />
                )}
            </span>

            <span className="flex flex-col min-w-0 flex-1 py-0.5">
                <span className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-[var(--accent)] leading-none truncate">
                    {article.category?.name || "News"}
                </span>
                <span className="mt-1.5 block font-display text-[13px] font-black text-white leading-[1.25] line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-200">
                    {article.title}
                </span>
                {article.published_at && (
                    <span className="mt-auto pt-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/25">
                        {publishedLabel(article.published_at)}
                    </span>
                )}
            </span>
        </Link>
    );
}

/**
 * The editorial strip under the pillars: the six newest published articles,
 * with the main sections as filters. One endpoint switches sections, so the
 * chips never cost four round trips.
 */
export default function LatestArticlesFeed() {
    const [filter, setFilter] = useState<FilterId>("all");

    const { data: articles, isLoading } = useSWR(`/feed/latest?type=${filter}&limit=6`, fetcher, {
        dedupingInterval: 300_000,
        revalidateOnFocus: false,
        keepPreviousData: true,
    });

    const active = FILTERS.find((f) => f.id === filter)!;

    return (
        <Panel
            title="From Games You Follow"
            action={{ label: "View all", href: active.href }}
            bodyClassName="p-4"
        >
            {/* the sections, as chips */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 mb-1 border-b border-white/[0.06]">
                {FILTERS.map((f) => {
                    const on = f.id === filter;
                    return (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            aria-pressed={on}
                            className={`shrink-0 h-8 px-3.5 rounded-full font-display text-[10.5px] font-bold uppercase tracking-[0.12em] border transition-colors duration-300 ${
                                on
                                    ? "bg-[var(--accent)] border-transparent text-white"
                                    : "bg-white/[0.03] border-white/[0.09] text-white/45 hover:text-white hover:border-white/25"
                            }`}
                        >
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {isLoading && !articles ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 items-stretch">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[89px] rounded-[var(--radius-card)] bg-white/[0.04] animate-pulse" />
                    ))}
                </div>
            ) : !articles?.length ? (
                <div className="pt-3">
                    <EmptyState
                        variant="compact"
                        title="Nothing published here yet"
                        body="Try another section — new stories land daily."
                        action={{ label: "Browse news", href: "/news" }}
                    />
                </div>
            ) : (
                // Two across, never three. This panel sits in the page's
                // eight-column slot, where a third column would leave each
                // headline about 150px beside a 104px picture.
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 items-stretch">
                    {articles.slice(0, 6).map((a, i) => (
                        <Row key={a.id} article={a} index={i} />
                    ))}
                </div>
            )}
        </Panel>
    );
}
