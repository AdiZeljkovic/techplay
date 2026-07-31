"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star } from "lucide-react";
import { Article } from "@/types";
import ScoreBadge from "@/components/ui/ScoreBadge";

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
                <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    <Star className="w-4 h-4 text-[var(--accent)]" />
                    TechPlay Reviews
                </h2>
                <Link href="/reviews" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150">
                    All reviews <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {scored.map((review, i) => {
                    const score = Number(review.review_score);
                    return (
                        <Link
                            key={review.id}
                            href={`/reviews/${review.slug}`}
                            className={`group relative flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300 tp-fade-up tp-d${Math.min(6, i + 1)}`}
                        >
                            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--fill-1)]">
                                {review.featured_image_url && (
                                    <Image
                                        src={review.featured_image_url}
                                        alt={review.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 25vw"
                                        className="object-cover transition-transform duration-700 ease-[var(--ease-hud)] group-hover:scale-[1.04]"
                                    />
                                )}
                                <div className="absolute inset-0 scrim-card" />

                                {/* bottom-right, matching Discover Games — one anchor site-wide */}
                                <div className="absolute bottom-3 right-3">
                                    <ScoreBadge score={score} />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col p-4">
                                <h3 className="font-display text-[14px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                    {review.title}
                                </h3>
                                <div className="mt-auto pt-3 flex items-center gap-2 text-[11px] text-[var(--ink-low)]">
                                    {review.author?.display_name || review.author?.name ? (
                                        <>
                                            <span className="text-[var(--ink-mid)] font-semibold truncate max-w-[110px]">
                                                {review.author.display_name || review.author.name}
                                            </span>
                                            <span className="text-[var(--ink-faint)]">·</span>
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
