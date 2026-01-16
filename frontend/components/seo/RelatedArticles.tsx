"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight } from "lucide-react";
import { Article } from "@/types";

interface RelatedArticlesProps {
    articles: Article[];
    title?: string;
    className?: string;
}

export default function RelatedArticles({
    articles,
    title = "Related Articles",
    className = ""
}: RelatedArticlesProps) {
    if (!articles || articles.length === 0) return null;

    return (
        <section className={`py-12 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="w-1 h-8 bg-[var(--accent)] rounded-full" />
                    {title}
                </h2>
                <Link
                    href="/news"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm font-semibold flex items-center gap-1 transition-colors"
                >
                    View All <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(0, 3).map((article) => (
                    <Link
                        key={article.id}
                        href={`/news/${article.slug}`}
                        className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/30 transition-all hover:shadow-lg hover:shadow-[var(--accent)]/5"
                    >
                        {/* Image */}
                        <div className="relative aspect-video overflow-hidden">
                            {article.featured_image_url ? (
                                <Image
                                    src={article.featured_image_url.startsWith('http')
                                        ? article.featured_image_url
                                        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                    <span className="text-[var(--text-muted)]">No image</span>
                                </div>
                            )}
                            {/* Category Badge */}
                            <div className="absolute top-3 left-3">
                                <span className="px-2 py-1 bg-[var(--accent)] text-white text-[10px] font-bold uppercase rounded">
                                    {article.category?.name || 'News'}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="text-white font-bold line-clamp-2 group-hover:text-[var(--accent)] transition-colors mb-2">
                                {article.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <Clock className="w-3 h-3" />
                                <span>5 min read</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
