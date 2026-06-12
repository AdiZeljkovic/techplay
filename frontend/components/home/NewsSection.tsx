"use client";

import Image from "next/image";
import Link from "next/link";
import { Article } from "@/types";
import { decodeHtml } from "@/lib/decode";

interface NewsSectionProps {
    articles: Article[];
}

function getArticleLink(article: Article) {
    if (article.category?.type === "reviews") return `/reviews/${article.slug}`;
    if (article.category?.type === "tech" || article.category?.slug?.includes("hardware")) return `/hardware/${article.slug}`;
    return `/news/${article.slug}`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function getImageSrc(url: string | undefined) {
    if (!url) return "/placeholder-image.webp";
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${url}`;
}

export default function NewsSection({ articles }: NewsSectionProps) {
    if (!articles || articles.length === 0) return null;

    const featured = articles[0];
    const list = articles.slice(1, 5);

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-end justify-between font-sans mb-5 border-b border-zinc-200 dark:border-white/10 pb-[10px]">
                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">LATEST NEWS</h2>
                <Link href="/news" className="text-tp-accent hover:text-tp-accent-hover transition-colors text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 group pb-1">
                    VIEW ALL NEWS <span className="group-hover:translate-x-1 transition-transform font-bold text-[14px] leading-none mb-[2px]">→</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] w-full">

                {/* Large Featured Card */}
                <Link href={getArticleLink(featured)} className="group relative rounded-xl overflow-hidden flex flex-col w-full min-h-[460px] border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none bg-white dark:bg-[#05070A] transition-colors duration-300">
                    <div className="absolute inset-0">
                        <Image
                            src={getImageSrc(featured.featured_image_url)}
                            alt={decodeHtml(featured.title)}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#05070A] dark:via-[#0B1117]/80 to-transparent h-[70%] mt-auto" />
                    </div>

                    <div className="relative z-10 mt-auto p-7 w-full flex flex-col justify-end">
                        <span className="text-tp-accent text-[11px] font-bold uppercase tracking-wider mb-2 block">
                            {decodeHtml(featured.category?.name || "")}
                        </span>
                        <h3 className="font-display text-[26px] font-bold text-zinc-900 dark:text-white leading-[1.1] mb-2.5">
                            {decodeHtml(featured.title)}
                        </h3>
                        <p className="text-[15px] text-zinc-600 dark:text-[#A1A1AA] mb-6 line-clamp-2 max-w-[95%] leading-relaxed">
                            {decodeHtml(featured.excerpt || "")}
                        </p>
                        {featured.author && (
                            <div className="flex items-center gap-3">
                                <div className="w-[32px] h-[32px] rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 relative shadow-sm">
                                    {featured.author.avatar_url ? (
                                        <Image src={featured.author.avatar_url} alt={featured.author.display_name || featured.author.username} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-200 dark:bg-[#1A1F26]" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-zinc-800 dark:text-[#E4E4E5] font-bold text-[12px] leading-tight">
                                        {decodeHtml(featured.author.display_name || featured.author.username)}
                                    </span>
                                    <span suppressHydrationWarning className="text-zinc-500 dark:text-[#71717A] text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                        {formatDate(featured.published_at)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </Link>

                {/* List of smaller articles */}
                <div className="flex flex-col justify-between">
                    {list.map((article, i) => (
                        <Link key={article.id} href={getArticleLink(article)} className={`group flex gap-[20px] pb-[16px] pt-[8px] ${i !== list.length - 1 ? "border-b border-zinc-200 dark:border-[#27272A]/80" : "mb-0 pb-0"}`}>
                            <div className="relative w-[140px] h-[90px] shrink-0 rounded-[6px] overflow-hidden opacity-90 group-hover:opacity-100 transition-opacity border border-zinc-200 dark:border-transparent">
                                <Image
                                    src={getImageSrc(article.featured_image_url)}
                                    alt={decodeHtml(article.title)}
                                    fill
                                    sizes="140px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex flex-col justify-center py-1">
                                <span className="text-tp-accent text-[10px] font-bold uppercase tracking-wider mb-1.5 block">
                                    {decodeHtml(article.category?.name || "")}
                                </span>
                                <h3 className="font-sans font-medium text-[16px] text-zinc-800 dark:text-[#E4E4E5] leading-[1.3] mb-3 group-hover:text-tp-accent transition-colors line-clamp-2">
                                    {decodeHtml(article.title)}
                                </h3>
                                {article.author && (
                                    <div className="flex items-center gap-2.5 mt-auto">
                                        <div className="w-[24px] h-[24px] rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 relative">
                                            {article.author.avatar_url ? (
                                                <Image src={article.author.avatar_url} alt={article.author.display_name || article.author.username} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-200 dark:bg-[#1A1F26]" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-zinc-800 dark:text-[#E4E4E5] font-bold text-[11px] leading-tight">
                                                {decodeHtml(article.author.display_name || article.author.username)}
                                            </span>
                                            <span suppressHydrationWarning className="text-zinc-500 dark:text-[#71717A] text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                                {formatDate(article.published_at)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </div>
    );
}
