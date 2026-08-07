"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { Article } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";
import { decodeHtml } from "@/lib/decode";

const fetcher = (url: string) => axios.get(url).then((res) => res.data.data);

interface RecommendedNewsProps {
    excludeSlug?: string;
}

interface RecommendedPayload {
    personalised: boolean;
    articles: Article[];
}

export default function RecommendedNews({ excludeSlug }: RecommendedNewsProps) {
    // The chronicle decides: articles about the games occupying this
    // reader, or most-read as an honest fallback for strangers.
    const { data, isLoading } = useSWR<RecommendedPayload>(
        `/feed/recommended-news${excludeSlug ? `?exclude=${excludeSlug}` : ""}`,
        fetcher
    );
    const articles = data?.articles;
    const heading = data?.personalised ? "RECOMMENDED FOR YOU" : "POPULAR NOW";

    if (isLoading) {
        return (
            <aside className="w-full bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-8">{heading}</h2>
                <div className="flex flex-col gap-[22px]">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="w-[110px] h-[72px] rounded-[10px] shrink-0" />
                            <div className="flex-1 py-2">
                                <Skeleton className="h-3 w-16 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        );
    }

    const recommended = (articles || []).filter((a) => a.slug !== excludeSlug).slice(0, 4);

    if (recommended.length === 0) return null;

    return (
        <aside className="w-full bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/20 dark:via-tp-accent/40 to-transparent" />
            <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-tp-accent/5 dark:bg-tp-accent/10 blur-[80px] rounded-full pointer-events-none" />

            <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-8 relative z-10">{heading}</h2>

            <div className="flex flex-col gap-[22px] relative z-10">
                {recommended.map((article) => {
                    const imageUrl = article.featured_image_url?.startsWith('http')
                        ? article.featured_image_url
                        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`;

                    return (
                        <Link key={article.slug} href={`/news/${article.slug}`} className="flex gap-4 group">
                            <div className="w-[110px] h-[72px] rounded-[10px] overflow-hidden shrink-0 border border-zinc-200 dark:border-[#161B22] relative">
                                {article.featured_image_url ? (
                                    <Image
                                        src={imageUrl!}
                                        alt={decodeHtml(article.title)}
                                        fill
                                        sizes="110px"
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-100 dark:bg-[#1A1F26]" />
                                )}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <span className="text-tp-accent text-[10px] font-bold uppercase tracking-widest mb-1.5 leading-none">
                                    {decodeHtml(article.category?.name) || "News"}
                                </span>
                                <h3 className="text-zinc-800 dark:text-white text-[13px] font-bold leading-[1.3] group-hover:text-tp-accent transition-colors line-clamp-2 mb-1">
                                    {decodeHtml(article.title)}
                                </h3>
                                <span className="text-zinc-500 dark:text-[#71717A] text-[10px] font-medium tracking-wide uppercase">
                                    {new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}
