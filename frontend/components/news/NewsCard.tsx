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
                className="group relative h-full bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-card)] overflow-hidden hover:border-[var(--accent)]/40 hover:border-[var(--accent)]/40 hover:-translate-x-1 transition-all duration-300"
            >
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)] scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-20" />
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
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/15 to-[var(--surface-2)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-[var(--accent)] text-white text-[10px] font-bold rounded uppercase tracking-widest leading-none inline-block shadow-sm shadow-[var(--accent)]/20">
                            {decodeHtml(article.category.name)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col">
                    <h3 className="text-[16px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors mb-2">
                        {decodeHtml(article.title)}
                    </h3>

                    <p className="text-[13px] text-white/45 leading-relaxed line-clamp-2 mb-4 flex-grow">
                        {decodeHtml(article.excerpt) || "No excerpt available for this article."}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/50 pt-4 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <User className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                            <span className="truncate">{article.author?.display_name || article.author?.username || "Editor"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span suppressHydrationWarning>{formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
});
