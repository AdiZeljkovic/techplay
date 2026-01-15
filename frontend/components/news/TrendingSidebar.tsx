"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { Article } from "@/types";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

const fetcher = (url: string) => axios.get(url).then((res) => res.data.data);

export default function TrendingSidebar() {
    const { data: trendingArticles, isLoading } = useSWR<Article[]>('/news/trending', fetcher);

    if (isLoading) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-lg">
                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-[var(--accent)] rounded-full" />
                    Trending Now
                </h4>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i}>
                            <Skeleton className="h-3 w-20 mb-1" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!trendingArticles || trendingArticles.length === 0) {
        return null;
    }

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-lg">
            <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-[var(--accent)] rounded-full" />
                Trending Now
            </h4>
            <div className="space-y-4">
                {trendingArticles.map((article) => (
                    <Link href={`/news/${article.slug}`} key={article.id} className="block group cursor-pointer">
                        <div className="text-xs text-[var(--accent)] font-bold mb-1 uppercase">
                            {article.category?.name || "News"}
                        </div>
                        <h5 className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                            {article.title}
                        </h5>
                    </Link>
                ))}
            </div>
        </div>
    );
}
