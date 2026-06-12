"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { Article } from "@/types";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { decodeHtml } from "@/lib/decode";

const fetcher = (url: string) => axios.get(url).then((res) => res.data.data);

export default function TrendingSidebar() {
    const { data: trendingArticles, isLoading } = useSWR<Article[]>('/news/trending', fetcher);

    if (isLoading) {
        return (
            <aside className="w-full bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-8">TRENDING NOW</h2>
                <div className="flex flex-col gap-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-6 w-8 shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        );
    }

    if (!trendingArticles || trendingArticles.length === 0) {
        return null;
    }

    return (
        <aside className="w-full bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/20 dark:via-tp-accent/40 to-transparent" />
            <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-tp-accent/5 dark:bg-tp-accent/10 blur-[80px] rounded-full pointer-events-none" />

            <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-8 relative z-10">TRENDING NOW</h2>

            <div className="flex flex-col relative z-10">
                {trendingArticles.map((article, i) => {
                    // Determine if this is a review article
                    const isReview =
                        article.category?.type === 'reviews' ||
                        article.category?.slug?.includes('review') ||
                        article.slug?.endsWith('-review');
                    const basePath = isReview ? '/reviews' : '/news';
                    return (
                        <Link
                            href={`${basePath}/${article.slug}`}
                            key={article.id}
                            className={`group flex gap-4 py-4 first:pt-0 last:pb-0 ${i !== trendingArticles.length - 1 ? 'border-b border-zinc-200 dark:border-white/[0.04]' : ''}`}
                        >
                            {/* Rank number */}
                            <span className="font-display text-[24px] font-black leading-none shrink-0 w-[34px] text-transparent bg-clip-text bg-gradient-to-b from-tp-accent to-tp-accent/40 dark:to-tp-accent/30">
                                {String(i + 1).padStart(2, '0')}
                            </span>

                            <div className="flex flex-col min-w-0">
                                <span className="text-tp-accent text-[10px] font-bold uppercase tracking-widest mb-1.5 leading-none">
                                    {decodeHtml(article.category?.name) || "News"}
                                </span>
                                <h3 className="text-[13px] font-bold text-zinc-800 dark:text-[#E4E4E5] leading-[1.35] group-hover:text-tp-accent transition-colors line-clamp-2">
                                    {decodeHtml(article.title)}
                                </h3>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}
