"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { LayoutGrid, Newspaper, Star, Cpu, BookOpen, FileText } from "lucide-react";
import NewsCard from "@/components/news/NewsCard";
import ReviewCard from "@/components/reviews/ReviewCard";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
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
    }

    function getStatCount(tabId: TabId): number {
        if (tabId === "all") return stats.total;
        return stats[tabId as keyof AuthorStats] ?? 0;
    }

    return (
        <div className="container-page py-10">

            {/* Tab filter */}
            <div className="flex flex-wrap gap-2 mb-8">
                {TABS.map(({ id, label, Icon }) => {
                    const isActive = activeTab === id;
                    const count = getStatCount(id);
                    return (
                        <button
                            key={id}
                            onClick={() => handleTabChange(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                                isActive
                                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                                    : "text-[#A1A1AA] border-[#161B22] hover:border-[var(--accent)]/40 hover:text-white bg-[#0B0E14]"
                            }`}
                        >
                            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[var(--accent)]"}`} />
                            {label}
                            <span className={`text-[10px] ${isActive ? "text-white/70" : "text-[#71717A]"}`}>
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
                        <div key={i} className="h-80 bg-[#0B0E14] rounded-xl animate-pulse border border-[#161B22]" />
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
                            onPrev={() => setPage(p => Math.max(1, p - 1))}
                            onNext={() => setPage(p => p + 1)}
                            prevDisabled={page <= 1}
                            nextDisabled={page >= lastPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}
