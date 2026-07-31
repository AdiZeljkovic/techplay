"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star } from "lucide-react";
import { Article } from "@/types";
import { getScoreMeta } from "./homeUI";

/**
 * Scored reviews rail — TechPlay's credibility signal. Data comes from the
 * /home payload as props, so the cards ship inside the SSR HTML.
 */
export default function ReviewWall({ reviews }: { reviews: Article[] }) {
    const scored = reviews.filter((r) => r.slug && (r.review_score ?? 0) > 0).slice(0, 4);
    if (scored.length === 0) return null;

    return (
        <section>
            <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-white font-display">
                    <span className="w-1.5 h-5 rounded-sm bg-[var(--accent)]" />
                    <Star className="w-4 h-4 text-[var(--accent)]" />
                    TechPlay Reviews
                </h2>
                <Link href="/reviews" className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                    All reviews <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {scored.map((review, i) => {
                    const score = Number(review.review_score);
                    const { color, label, glow } = getScoreMeta(score);
                    return (
                        <Link
                            key={review.id}
                            href={`/reviews/${review.slug}`}
                            className={`group relative flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[var(--bg-card)] hover:border-[var(--accent)]/40 transition-colors tp-fade-up tp-d${Math.min(6, i + 1)}`}
                        >
                            <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.03]">
                                {review.featured_image_url && (
                                    <Image
                                        src={review.featured_image_url}
                                        alt={review.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 25vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                                {/* Score badge */}
                                <div
                                    className="absolute top-3 right-3 flex flex-col items-center justify-center w-[52px] h-[52px] rounded-xl backdrop-blur-sm"
                                    style={{ backgroundColor: "rgba(2,6,18,0.8)", border: `1.5px solid ${color}`, boxShadow: `0 0 18px ${glow}` }}
                                >
                                    <span className="text-[19px] font-black leading-none tabular-nums" style={{ color }}>
                                        {score.toFixed(1)}
                                    </span>
                                    <span className="text-[6px] font-black uppercase tracking-[0.1em] mt-0.5" style={{ color }}>
                                        {label}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col p-4">
                                <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                    {review.title}
                                </h3>
                                <div className="mt-auto pt-3 flex items-center gap-2 text-[11px] text-white/40">
                                    {review.author?.display_name || review.author?.name ? (
                                        <>
                                            <span className="text-white/60 font-semibold truncate max-w-[110px]">
                                                {review.author.display_name || review.author.name}
                                            </span>
                                            <span className="text-white/20">·</span>
                                        </>
                                    ) : null}
                                    <span>{review.published_at_human}</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
