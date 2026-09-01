"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { Article } from "@/types";
import Link from "next/link";
import { articleHref } from "@/lib/articleHref";
import Image from "next/image";
import Panel from "@/components/ui/Panel";
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
    const heading = data?.personalised ? "Recommended for you" : "Popular now";

    if (isLoading) {
        return (
            <Panel title={heading} padding="none">
                <div className="divide-y divide-white/[0.05]">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-3 p-3.5">
                            <Skeleton className="w-[96px] h-[64px] rounded-[var(--radius-card)] shrink-0" />
                            <div className="flex-1 py-1">
                                <Skeleton className="h-2.5 w-14 mb-2" />
                                <Skeleton className="h-3.5 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }

    const recommended = (articles || []).filter((a) => a.slug !== excludeSlug).slice(0, 4);

    if (recommended.length === 0) return null;

    return (
        <Panel title={heading} padding="none">
            <div className="divide-y divide-white/[0.05]">
                {recommended.map((article) => {
                    const imageUrl = article.featured_image_url?.startsWith("http")
                        ? article.featured_image_url
                        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`;

                    return (
                        <Link
                            key={article.slug}
                            href={articleHref(article)}
                            className="group flex gap-3 p-3.5 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="relative w-[96px] h-[64px] rounded-[var(--radius-card)] overflow-hidden shrink-0 border border-white/[0.06] bg-black/40">
                                {article.featured_image_url ? (
                                    <Image
                                        src={imageUrl!}
                                        alt={decodeHtml(article.title)}
                                        fill
                                        sizes="96px"
                                        className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[var(--surface-2)]" />
                                )}
                            </div>

                            <div className="flex flex-col justify-center min-w-0">
                                <span className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-[var(--accent)] leading-none">
                                    {decodeHtml(article.category?.name) || "News"}
                                </span>
                                <h3 className="mt-1.5 font-display text-[13px] font-black text-white leading-[1.25] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                    {decodeHtml(article.title)}
                                </h3>
                                <span className="mt-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/45">
                                    {new Date(article.published_at).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </Panel>
    );
}
