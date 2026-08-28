"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Review } from "@/types";
import { getImageUrl } from "@/lib/imageUrl";
import { decodeHtml } from "@/lib/decode";

interface ReviewCardProps {
    review: Review;
    index: number;
    basePath?: string; // Default: /reviews, but can be /hardware, /tech, etc.
    hideRating?: boolean;
}

// PERF: Memoized to prevent re-renders when parent list updates
export default memo(function ReviewCard({ review, index, basePath = "/reviews", hideRating = false }: ReviewCardProps) {
    // Use review_score (new system) with fallback to rating (legacy)
    const score = review.review_score ?? review.rating ?? 0;

    // Get medium variant for card images (better quality for h-48 cards on retina displays)
    const rawImageUrl = review.featured_image_url || review.cover_image;
    const imageUrl = rawImageUrl
        ? getImageUrl(
            rawImageUrl.startsWith('http') ? rawImageUrl : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${rawImageUrl}`,
            'medium'
        )
        : null;

    return (
        <Link href={`${basePath}/${review.slug}`}>
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
                            alt={review.title}
                            fill
                            quality={80}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/15 to-[var(--surface-2)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                    {/* Score Badge - ribbon style, matches homepage ReviewsSection */}
                    {!hideRating && score > 0 && (
                        <div
                            className="absolute top-0 right-4 w-[42px] sm:w-[54px] h-[50px] sm:h-[64px] bg-[var(--accent)] flex flex-col items-center justify-end pb-2 sm:pb-3 shadow-[0_5px_15px_rgba(0,0,0,0.5)] group-hover:h-[56px] sm:group-hover:h-[70px] transition-all duration-300"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)" }}
                        >
                            <span className="text-[15px] sm:text-[18px] font-black font-display leading-none text-white">
                                {Number(score).toFixed(1)}
                            </span>
                        </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 bg-[var(--accent)] text-white text-[10px] font-bold rounded uppercase tracking-widest leading-none inline-block shadow-sm shadow-[var(--accent)]/20">
                            {decodeHtml(review.category?.name) || 'Latest'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
                    {review.review_data?.game_title && (
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1.5">{review.review_data.game_title}</p>
                    )}

                    <h3 className="text-[16px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors mb-2">
                        {decodeHtml(review.title)}
                    </h3>

                    <p className="text-[13px] text-white/45 leading-relaxed line-clamp-2 mb-4 flex-grow">
                        {decodeHtml(review.excerpt || review.summary) || "Read our full review for the verdict."}
                    </p>

                    {/* Star Rating - Hidden if hideRating is true */}
                    {!hideRating && (
                        <div className="flex items-center gap-1 mt-auto pt-4 border-t border-white/[0.04]">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.round(score / 2) ? "text-[var(--accent)] fill-[var(--accent)]" : "text-white/60 dark:text-white/12"}`}
                                />
                            ))}
                            <span className="text-[12px] font-bold text-white/50 ml-2">{score}/10</span>
                        </div>
                    )}
                </div>
            </motion.article>
        </Link>
    );
});
