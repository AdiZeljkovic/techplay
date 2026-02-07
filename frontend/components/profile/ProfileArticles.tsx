"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RecentArticle } from "@/lib/types/profile";

interface ProfileArticlesProps {
    articles: RecentArticle[];
}

export default function ProfileArticles({ articles }: ProfileArticlesProps) {
    if (!articles || articles.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-xl text-[var(--text-muted)]">
                No published articles yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.map((article) => (
                <Link
                    key={article.id}
                    href={`/${article.type === "review" ? "reviews" : article.type === "news" ? "news" : "guides"}/${article.slug}`}
                    className="group"
                >
                    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden hover:border-[var(--accent)] transition-all hover:shadow-lg hover:shadow-[var(--accent)]/10">
                        {article.featured_image && (
                            <div className="aspect-video relative overflow-hidden">
                                <img
                                    src={article.featured_image}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 left-2">
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            article.type === "review"
                                                ? "bg-purple-500/90 text-white"
                                                : article.type === "news"
                                                  ? "bg-blue-500/90 text-white"
                                                  : "bg-emerald-500/90 text-white"
                                        }`}
                                    >
                                        {article.type}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="p-4">
                            <h4 className="font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                {article.title}
                            </h4>
                            {article.excerpt && (
                                <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{article.excerpt}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-muted)]">
                                <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {article.views?.toLocaleString() || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
