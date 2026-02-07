"use client";

import Link from "next/link";
import { Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RecentArticle } from "@/lib/types/profile";

interface ProfileArticlesProps {
    articles: RecentArticle[];
}

const typeColors: Record<string, string> = {
    review: "bg-purple-500/90",
    news: "bg-blue-500/90",
    guide: "bg-emerald-500/90",
};

export default function ProfileArticles({ articles }: ProfileArticlesProps) {
    if (!articles || articles.length === 0) {
        return (
            <div className="p-10 text-center border border-dashed border-white/[0.06] rounded-xl text-white/30">
                No published articles yet.
            </div>
        );
    }

    const getArticleUrl = (article: RecentArticle) =>
        `/${article.type === "review" ? "reviews" : article.type === "news" ? "news" : "guides"}/${article.slug}`;

    const [featured, ...rest] = articles;

    return (
        <div className="space-y-4">
            {/* Featured article - full width hero */}
            <Link href={getArticleUrl(featured)} className="group block">
                <div className="relative rounded-2xl overflow-hidden glow-card border border-white/[0.06] aspect-[21/9]">
                    {featured.featured_image ? (
                        <img
                            src={featured.featured_image}
                            alt={featured.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)]" />
                    )}

                    {/* Heavy bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Type badge */}
                    <div className="absolute top-4 left-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider text-white ${typeColors[featured.type] || typeColors.guide}`}>
                            {featured.type}
                        </span>
                    </div>

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-xl md:text-2xl font-black text-white mb-2 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                            {featured.title}
                        </h3>
                        {featured.excerpt && (
                            <p className="text-sm text-white/60 line-clamp-2 max-w-2xl mb-3">{featured.excerpt}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/40">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-3 h-3" />
                                {featured.views?.toLocaleString() || 0} views
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Rest - 2 column grid with image-dominant cards */}
            {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rest.map((article) => (
                        <Link key={article.id} href={getArticleUrl(article)} className="group">
                            <div className="glow-card rounded-xl overflow-hidden border border-white/[0.06] bg-[var(--bg-card)] hover:border-white/10 transition-all">
                                <div className="relative aspect-video overflow-hidden">
                                    {article.featured_image ? (
                                        <img
                                            src={article.featured_image}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)]" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                                    <div className="absolute top-3 left-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${typeColors[article.type] || typeColors.guide}`}>
                                            {article.type}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3">
                                        <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                            {article.title}
                                        </h4>
                                    </div>
                                </div>

                                <div className="p-3 flex items-center justify-between text-[11px] text-white/30">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {article.views?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
