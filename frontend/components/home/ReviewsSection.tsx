"use client";

import Image from "next/image";
import Link from "next/link";
import { Article } from "@/types";
import { decodeHtml } from "@/lib/decode";

interface ReviewsSectionProps {
    articles: Article[];
}

function getImageSrc(url: string | undefined) {
    if (!url) return "/placeholder-image.webp";
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${url}`;
}

export default function ReviewsSection({ articles }: ReviewsSectionProps) {
    if (!articles || articles.length === 0) return null;

    const reviewCards = articles.slice(0, 8);

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-end justify-between font-sans mb-8 border-b border-zinc-200 dark:border-white/[0.05] pb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.1em]">LATEST REVIEWS</h2>
                </div>
                <Link href="/reviews" className="text-zinc-500 dark:text-[#A1A1AA] hover:text-tp-accent transition-colors text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 group pb-1">
                    VIEW ALL REVIEWS <span className="group-hover:translate-x-1 transition-transform font-bold text-[14px] leading-none mb-[2px]">→</span>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 w-full">
                {reviewCards.map((review) => {
                    const score = parseFloat(String(review.review_score ?? 0)) || 0;

                    return (
                        <Link
                            key={review.id}
                            href={`/reviews/${review.slug}`}
                            className="group relative flex flex-col w-full aspect-[3/4] bg-zinc-50 dark:bg-[#0B0E14] rounded-[16px] overflow-hidden border border-zinc-200 dark:border-[#161B22] hover:border-tp-accent/40 transition-all duration-300 shadow-sm dark:shadow-lg hover:shadow-[0_0_30px_rgba(252,65,0,0.15)] hover:-translate-y-1"
                        >
                            {/* Orange accent bar — slides in on hover */}
                            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-tp-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-30" />
                            <Image
                                src={getImageSrc(review.featured_image_url)}
                                alt={decodeHtml(review.title)}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 dark:opacity-70 group-hover:opacity-100"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 dark:from-[#05070A] dark:via-[#05070A]/40 to-transparent opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent dark:from-[#05070A] dark:via-transparent to-transparent opacity-100" />

                            {/* Score Ribbon */}
                            {score > 0 && (
                                <div
                                    className="absolute top-0 right-4 sm:right-6 w-[42px] sm:w-[54px] h-[50px] sm:h-[64px] bg-tp-accent flex flex-col items-center justify-end pb-2 sm:pb-3 shadow-[0_5px_15px_rgba(0,0,0,0.5)] group-hover:h-[56px] sm:group-hover:h-[70px] transition-all duration-300"
                                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)" }}
                                >
                                    <span className="font-display text-[17px] sm:text-[22px] font-bold text-white leading-none drop-shadow-md tracking-tighter">
                                        {score.toFixed(1)}
                                    </span>
                                </div>
                            )}

                            {/* Review Badge */}
                            <div className="absolute top-3 sm:top-5 left-3 sm:left-5 bg-white/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-white/10 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded flex items-center gap-1 sm:gap-1.5 shadow-sm dark:shadow-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-tp-accent animate-pulse" />
                                <span className="text-zinc-900 dark:text-[#E4E4E5] text-[10px] font-bold uppercase tracking-widest leading-none mt-[1px]">REVIEW</span>
                            </div>

                            {/* Content Bottom */}
                            <div className="relative z-10 flex flex-col p-3 sm:p-6 mt-auto">
                                <h3 className="font-sans font-bold text-[13px] sm:text-[20px] text-white leading-[1.2] group-hover:text-tp-accent transition-colors drop-shadow-sm dark:drop-shadow-lg line-clamp-3">
                                    {decodeHtml(review.title)}
                                </h3>
                            </div>

                            {/* Glowing bottom line */}
                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-tp-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
