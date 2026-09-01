"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { LayoutGrid, Newspaper, Star, Cpu, BookOpen, FileText } from "lucide-react";
import NewsCard from "@/components/news/NewsCard";
import ReviewCard from "@/components/reviews/ReviewCard";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import { usePagedList } from "@/hooks/usePagedList";
import type { Article, Review, AuthorStats } from "@/types";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

const TABS = [
    { id: "all",     label: "All",     Icon: LayoutGrid },
    { id: "news",    label: "News",    Icon: Newspaper },
    { id: "reviews", label: "Reviews", Icon: Star },
    { id: "tech",    label: "Tech",    Icon: Cpu },
    { id: "guides",  label: "Guides",  Icon: BookOpen },
] as const;

type TabId = typeof TABS[number]["id"];

interface AuthorArticleGridProps {
    slug: string;
    stats: AuthorStats;
}

export default function AuthorArticleGrid({ slug, stats }: AuthorArticleGridProps) {
    const [activeTab, setActiveTab] = useState<TabId>("all");
    const [page, setPage] = useState(1);
    /** The pager sits under the grid; a new page starts at its top. */
    const { ref: listTop, scrollToTop } = usePagedList<HTMLDivElement>();

    /*
     * Which page you are on belongs in the address, not only in memory.
     *
     * It was state and nothing else, so it survived exactly as long as the
     * component did: read to page six, open an article, press back, and you
     * landed on page one at the top of the profile with five pages to walk
     * again. The browser had done its job — it returned you to
     * /author/adi-zeljkovic, which is genuinely all the page had ever said
     * about where you were.
     *
     * history.replaceState rather than the router: this is a filter on a list,
     * not a navigation. The router would fetch the route again on every page
     * turn, and push would bury the way out under six back-presses. This
     * writes the address and nothing else moves.
     */
    const rememberInUrl = useCallback((nextPage: number, nextTab: TabId) => {
        if (typeof window === "undefined") return;

        const q = new URLSearchParams(window.location.search);
        // The defaults stay out of the address — a clean URL is the shareable one.
        if (nextTab === "all") q.delete("type"); else q.set("type", nextTab);
        if (nextPage <= 1) q.delete("page"); else q.set("page", String(nextPage));

        const qs = q.toString();
        window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    }, []);

    /*
     * Read back on mount, not during render.
     *
     * The page is ISR-cached, so the server renders it with no query string at
     * all while the browser arriving back from an article has ?page=6 in the
     * address. Seeding state from the URL during render would make those two
     * disagree and break hydration; an effect runs after, when only the
     * browser's answer exists. It costs one extra request, and only on the
     * return journey this exists to fix.
     */
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);

        const tab = q.get("type");
        if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab as TabId);

        const p = Number(q.get("page"));
        if (Number.isFinite(p) && p > 1) setPage(p);
    }, []);

    const goToPage = (next: number) => {
        setPage(next);
        rememberInUrl(next, activeTab);
        scrollToTop();
    };

    const params = new URLSearchParams({ page: String(page) });
    if (activeTab !== "all") params.set("type", activeTab);

    const { data, isLoading } = useSWR(
        `/authors/${slug}/articles?${params.toString()}`,
        fetcher,
        { keepPreviousData: true }
    );

    const items: any[] = data?.data || [];
    const lastPage = data?.last_page ?? 1;
    const total = data?.total ?? 0;

    function handleTabChange(tab: TabId) {
        setActiveTab(tab);
        setPage(1);
        rememberInUrl(1, tab);
    }

    function getStatCount(tabId: TabId): number {
        if (tabId === "all") return stats.total;
        return stats[tabId as keyof AuthorStats] ?? 0;
    }

    return (
        <div ref={listTop} className="container-page py-10">

            {/* Tab filter */}
            <div className="flex flex-wrap gap-2 mb-8">
                {TABS.map(({ id, label, Icon }) => {
                    const isActive = activeTab === id;
                    const count = getStatCount(id);
                    return (
                        <button
                            key={id}
                            onClick={() => handleTabChange(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-card)] text-[11px] font-bold uppercase tracking-wider transition-all border ${
                                isActive
                                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                                    : "text-white/45 border-white/[0.07] hover:border-[var(--accent)]/40 hover:text-white bg-[var(--surface-1)]"
                            }`}
                        >
                            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[var(--accent)]"}`} />
                            {label}
                            <span className={`text-[10px] ${isActive ? "text-white/70" : "text-white/50"}`}>
                                ({count})
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-80 bg-[var(--surface-1)] rounded-[var(--radius-card)] animate-pulse border border-white/[0.07]" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <ListingEmptyState
                    icon={FileText}
                    title="No articles yet"
                    description="This author hasn't published any content in this category."
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
                        {items.map((item, idx) => {
                            const type = item.category?.type || item.type || "news";

                            if (type === "reviews" || type === "review") {
                                return (
                                    <ReviewCard
                                        key={item.id}
                                        review={item as Review}
                                        index={idx}
                                        basePath="/reviews"
                                    />
                                );
                            }

                            // Guides and news/tech all use NewsCard
                            const articleItem: Article = {
                                ...item,
                                category: item.category ?? { id: 0, name: "Guides", slug: "guides", type: "guides" },
                            };

                            return <NewsCard key={item.id} article={articleItem} index={idx} />;
                        })}
                    </div>

                    {lastPage > 1 && (
                        <ListingPagination
                            page={page}
                            lastPage={lastPage}
                            onPrev={() => goToPage(Math.max(1, page - 1))}
                            onNext={() => goToPage(page + 1)}
                            prevDisabled={page <= 1}
                            nextDisabled={page >= lastPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}
