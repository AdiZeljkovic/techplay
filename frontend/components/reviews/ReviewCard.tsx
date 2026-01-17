"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Review } from "@/types";

interface ReviewCardProps {
    review: Review;
    index: number;
}

export default function ReviewCard({ review, index }: ReviewCardProps) {
    // Use review_score (new system) with fallback to rating (legacy)
    const score = review.review_score ?? review.rating ?? 0;
    const ratingColor = score >= 8 ? "text-green-500" : score >= 6 ? "text-yellow-500" : "text-red-500";
    const ratingBg = score >= 8 ? "bg-green-500/10" : score >= 6 ? "bg-yellow-500/10" : "bg-red-500/10";

    // featured_image_url now comes as full URL from API
    const imageUrl = review.featured_image_url || review.cover_image;

    return (
        <Link href={`/reviews/${review.slug}`}>
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
                            src={imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${imageUrl}`}
                            alt={review.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-light)] to-[var(--bg-elevated)]" />
                    )}

                    {/* Score Badge */}
                    <div className={`absolute top-3 right-3 w-12 h-12 rounded-full ${ratingBg} backdrop-blur-md border border-[var(--border)] flex items-center justify-center`}>
                        <span className={`text-lg font-bold ${ratingColor}`}>{score}</span>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 bg-[var(--accent)] text-white text-xs font-semibold rounded uppercase">
                            {review.category?.name || 'Latest'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col">
                    {review.review_data?.game_title && (
                        <p className="text-sm font-medium text-[var(--accent)] mb-1">{review.review_data.game_title}</p>
                    )}

                    <h3 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors mb-2">
                        {review.title}
                    </h3>

                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-grow">
                        {review.excerpt || review.summary || "Read our full review for the verdict."}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.round(score / 2) ? "text-yellow-400 fill-yellow-400" : "text-[var(--text-muted)]"}`}
                            />
                        ))}
                        <span className="text-sm text-[var(--text-muted)] ml-2">{score}</span>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
}
