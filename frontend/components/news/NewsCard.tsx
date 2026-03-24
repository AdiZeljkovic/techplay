"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import { Article } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from "@/lib/imageUrl";
import { decodeHtml } from "@/lib/decode";

interface NewsCardProps {
    article: Article;
    index: number;
}

// PERF: Memoized to prevent re-renders when parent list updates
export default memo(function NewsCard({ article, index }: NewsCardProps) {
    // Get medium variant for card images (better quality for retina displays)
    const imageUrl = article.featured_image_url
        ? getImageUrl(
            article.featured_image_url.startsWith('http')
                ? article.featured_image_url
                : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`,
            'medium'
        )
        : null;

    return (
        <Link href={`/news/${article.slug}`}>
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="group h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300"
            >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={article.title}
                            fill
                            quality={80}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-light)] to-[var(--bg-elevated)]" />
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-[var(--accent)] text-white text-xs font-semibold rounded uppercase">
                            {decodeHtml(article.category.name)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors mb-2">
                        {decodeHtml(article.title)}
                    </h3>

                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-grow">
                        {decodeHtml(article.excerpt) || "No excerpt available for this article."}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>{article.author?.display_name || article.author?.username || "Editor"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span suppressHydrationWarning>{formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
});
