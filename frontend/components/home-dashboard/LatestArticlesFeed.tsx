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

function publishedLabel(iso?: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** One article: art left, category kicker, headline. */
function Row({ article, index }: { article: FeedItem; index: number }) {
    return (
        <Link
            href={article.url}
            className={`group flex gap-3.5 p-2 rounded-[10px] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300 tp-fade-up tp-d${Math.min(6, index + 1)}`}
        >
            <span className="relative w-[108px] h-[64px] shrink-0 rounded-[8px] overflow-hidden bg-[var(--fill-1)] border border-white/[0.07]">
                {article.featured_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={article.featured_image_url}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-[var(--ease-hud)]"
                    />
                )}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-display text-[9.5px] font-bold uppercase tracking-[0.14em]">
                    {article.category?.name && <span className="text-[var(--accent)] truncate">{article.category.name}</span>}
                    {article.published_at && (
                        <>
                            <span aria-hidden className="text-white/20">·</span>
                            <span className="text-white/30 shrink-0">{publishedLabel(article.published_at)}</span>
                        </>
                    )}
                </span>
                <span className="mt-1.5 block font-display text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-200">
                    {article.title}
                </span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 pt-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[80px] rounded-[10px] bg-white/[0.04] animate-pulse" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 pt-3">
                    {articles.slice(0, 6).map((a, i) => (
                        <Row key={a.id} article={a} index={i} />
                    ))}
                </div>
            )}
        </Panel>
    );
}
