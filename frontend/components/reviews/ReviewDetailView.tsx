"use client";

import { Review } from "@/types";
import Link from "next/link";
import { Clock, Calendar, Check, X, Star } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import TableOfContents from "@/components/ui/TableOfContents";
import AdUnit from "@/components/ads/AdUnit";
import SocialShare from "@/components/share/SocialShare";
import CommentsSection from "@/components/comments/CommentsSection";
import ReviewSidebar from "@/components/reviews/ReviewSidebar";
import TrendingSidebar from "@/components/news/TrendingSidebar";
import { Article } from "@/types";
import DOMPurify from "isomorphic-dompurify";
import LiveViewCount from "@/components/tracking/LiveViewCount";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedArticles from "@/components/seo/RelatedArticles";

interface ReviewDetailViewProps {
    review: Review;
}

// Helper to process content for TOC (simplified version or reuse lib)
// Since we can't import `processContent` easily if it uses server-only deps (cheerio might be heavy), but `lib/content` uses cheerio.
// Let's assume standard client-side usage is fine or we duplicate simple regex logic if needed. 
// ArticleDetailView uses `processContent` from `@/lib/content`.
import { processContent } from "@/lib/content";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import ArticleFooterMessage from "@/components/ui/ArticleFooterMessage";
import { decodeHtml } from "@/lib/decode";

export default function ReviewDetailView({ review }: ReviewDetailViewProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    useEmbedScripts();

    // Calculate reading time
    const readingTime = useMemo(() => {
        const text = (review.content || '').replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }, [review.content]);

    // Handle scroll for sticky header/share (rAF throttle + passive for better INP)
    useEffect(() => {
        let rafId: number;
        const handleScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > 400);
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    if (!review) return null;

    const displayScore = Number(review.review_score ?? review.rating ?? 0);
    const ratingColor = displayScore >= 8 ? "text-green-500 border-green-500" : displayScore >= 6 ? "text-yellow-500 border-yellow-500" : "text-red-500 border-red-500";
    const scoreBg = displayScore >= 8 ? "bg-green-500" : displayScore >= 6 ? "bg-yellow-500" : "bg-red-500";

    // JSON-LD: Product with review (Google requires review/offers/aggregateRating on Product)
    const ratingValue = Number(review.review_score ?? review.rating ?? 0);
    const reviewObj: Record<string, any> = {
        "@type": "Review",
        "headline": review.seo_title || review.title,
        "author": {
            "@type": "Person",
            "name": review.author?.display_name || review.author?.username || "TechPlay Reviewer",
            "url": `${process.env.NEXT_PUBLIC_APP_URL}/profile/${review.author?.username}`
        },
        "publisher": {
            "@type": "Organization",
            "name": "TechPlay",
            "url": process.env.NEXT_PUBLIC_APP_URL
        },
        "datePublished": review.published_at || review.created_at,
        "reviewBody": review.summary || review.excerpt || ""
    };
    // Only include reviewRating when we have a valid score
    if (ratingValue > 0) {
        reviewObj["reviewRating"] = {
            "@type": "Rating",
            "ratingValue": ratingValue.toString(),
            "bestRating": "10",
            "worstRating": "1"
        };
    }
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": review.item_name || review.title,
        "image": review.cover_image || review.featured_image_url,
        "review": reviewObj
    };

    const { content: processedContent, toc } = useMemo(() => processContent(review.content || ''), [review.content]);

    const imageUrl = (review.cover_image || review.featured_image_url)
        ? ((review.cover_image || review.featured_image_url)!.startsWith('http')
            ? (review.cover_image || review.featured_image_url)!
            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${review.cover_image || review.featured_image_url}`)
        : null;

    return (
        <article className="min-h-screen bg-[var(--bg-primary)] pb-20">
            <Script
                id="review-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Immersive Hero Header */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={review.title || "Review Cover"}
                            fill
                            className="object-cover"
                            priority
                            quality={90}
                            sizes="100vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-12 z-10">
                    <div className="max-w-4xl">
                        <Breadcrumbs
                            items={[
                                { label: 'Reviews', href: '/reviews' },
                                { label: decodeHtml(review.title) },
                            ]}
                            className="mb-6"
                        />

                        <div className="mb-4 animate-fade-in-up flex items-center gap-3">
                            <span className="px-4 py-1.5 text-xs font-bold tracking-wider bg-[var(--accent)] text-white rounded-full uppercase shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]">
                                {decodeHtml(review.category?.name) || "Review"}
                            </span>

                            {/* Score Check in Hero */}
                            <div className={`px-3 py-1 rounded-full border ${ratingColor} bg-black/50 backdrop-blur text-sm font-bold flex items-center gap-2 ml-auto md:ml-0`}>
                                <Star className={`w-4 h-4 ${ratingColor.split(' ')[0]} fill-current`} />
                                <span>{displayScore.toFixed(1)}/10</span>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-xl animate-fade-in-up delay-100">
                            {decodeHtml(review.title)}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-white/90 animate-fade-in-up delay-200">
                            <Link href={`/profile/${review.author?.username}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] overflow-hidden group-hover:scale-105 transition-transform">
                                    {review.author?.avatar_url ? (
                                        <Image
                                            src={review.author.avatar_url}
                                            alt={review.author.username}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent)] font-bold">
                                            {review.author?.username?.charAt(0).toUpperCase() || "E"}
                                        </div>
                                    )}
                                </div>
                                <div className="group-hover:text-[var(--accent)] transition-colors">
                                    <p className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                                        {decodeHtml(review.author?.display_name || review.author?.username || "TechPlay Reviewer")}
                                    </p>
                                    <p className="text-xs text-white/60">Reviewer</p>
                                </div>
                            </Link>

                            <div className="hidden md:block w-px h-10 bg-white/20" />

                            <div className="flex flex-col">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                                    {(() => {
                                        const d = new Date(review.published_at || review.created_at);
                                        return isNaN(d.getTime()) ? 'N/A' : format(d, 'dd/MM/yyyy');
                                    })()}
                                </span>
                                <span className="text-xs text-white/60">Published</span>
                            </div>

                            <div className="hidden md:block w-px h-10 bg-white/20" />

                            <div className="flex flex-col">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Clock className="w-4 h-4 text-[var(--accent)]" />
                                    {readingTime}
                                </span>
                                <span className="text-xs text-white/60">Read Time</span>
                            </div>

                            <div className="hidden md:block w-px h-10 bg-white/20" />

                            <div className="flex flex-col">
                                <LiveViewCount slug={review.slug} initialViews={(review as any).views || 0} />
                                <span className="text-xs text-white/60">Views</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Social Sidebar (Left on Desktop) */}
                    <div className="hidden lg:block lg:col-span-1 h-full min-w-0">
                        <div className={`sticky top-32 transition-all duration-300 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            <SocialShare
                                url={`/reviews/${review.slug}`}
                                title={decodeHtml(review.title)}
                                description={decodeHtml(review.excerpt) || ''}
                                vertical={true}
                            />
                        </div>
                    </div>

                    {/* Article Body (Center) */}
                    <div className="lg:col-span-8 min-w-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden backdrop-blur-3xl bg-opacity-90">
                        {/* Decorative Background Blur */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

                        {/* Summary / Excerpt */}
                        {review.summary && (
                            <div className="mb-10 pl-6 border-l-4 border-[var(--accent)]">
                                <p className="text-xl md:text-2xl font-medium text-[var(--text-primary)] leading-relaxed italic">
                                    "{decodeHtml(review.summary)}"
                                </p>
                            </div>
                        )}

                        {/* Main Text */}
                        {processedContent ? (
                            <div
                                className="prose prose-lg md:prose-xl max-w-none
                                    prose-headings:text-[var(--text-primary)] prose-headings:font-bold prose-headings:tracking-tight
                                    prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:first:mt-0
                                    prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-6 prose-h3:mb-2
                                    prose-p:text-[var(--text-secondary)] prose-p:leading-8 prose-p:mb-4
                                    prose-a:text-[var(--accent)] prose-a:underline prose-a:decoration-[var(--accent)]/40 prose-a:underline-offset-2 hover:prose-a:decoration-[var(--accent)] hover:prose-a:text-[var(--accent-hover)] prose-a:transition-all
                                    prose-strong:text-white prose-strong:font-semibold
                                    prose-em:text-[var(--text-secondary)] prose-em:italic prose-em:font-normal
                                    prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-[var(--border)] prose-img:my-3
                                    prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:pl-6 prose-blockquote:my-5 prose-blockquote:italic prose-blockquote:text-[var(--text-primary)] prose-blockquote:font-medium prose-blockquote:bg-[var(--bg-elevated)]/30 prose-blockquote:py-4 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg
                                    prose-code:bg-[var(--bg-elevated)] prose-code:text-[var(--accent)] prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
                                    prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:text-[var(--text-secondary)]
                                    prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:text-[var(--text-secondary)]
                                    prose-li:mb-1.5
                                    prose-hr:border-[var(--border)] prose-hr:my-6
                                    [&_p:has(img)]:mb-0 [&_p:has(img)]:leading-none
                                    [&_iframe]:w-full [&_iframe]:min-h-[400px] [&_iframe]:max-w-full [&_iframe]:rounded-2xl [&_iframe]:shadow-xl [&_iframe]:border [&_iframe]:border-[var(--border)] [&_iframe]:my-3
                                    [&_p:has(iframe)]:mb-0 [&_p:has(iframe)]:leading-none
                                    [&_figure]:my-3 [&_figure]:text-center [&_figcaption]:text-sm [&_figcaption]:text-[var(--text-secondary)] [&_figcaption]:mt-2
                                "
                                dangerouslySetInnerHTML={{ __html: processedContent }}
                            />
                        ) : (
                            <div className="py-20 text-center text-[var(--text-secondary)]">
                                <p className="italic">No written review content available.</p>
                            </div>
                        )}

                        <div className="my-12 lg:hidden">
                            <AdUnit position="article_mid" />
                        </div>

                        {/* REVIEW SUMMARY & SCORES (Moved from Sidebar) */}
                        <div className="my-12">
                            {review.review_data ? (
                                <ReviewSidebar article={review as unknown as Article} />
                            ) : (
                                /* Legacy Fallback for Reviews without new data structure */
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-lg text-center">
                                    <div className={`w-32 h-32 mx-auto rounded-full border-4 ${ratingColor} bg-[var(--bg-card)] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
                                        <span className={`text-5xl font-bold ${ratingColor.split(' ')[0]}`}>{review.rating}</span>
                                    </div>
                                    <p className="text-[var(--text-muted)] font-medium uppercase tracking-widest text-sm mb-6">Overall Score</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                        <div>
                                            <h4 className="text-green-500 font-bold text-sm mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> The Good</h4>
                                            <ul className="space-y-2">
                                                {review.pros?.map((p, i) => (
                                                    <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0" /> {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-red-500 font-bold text-sm mb-3 flex items-center gap-2"><X className="w-4 h-4" /> The Bad</h4>
                                            <ul className="space-y-2">
                                                {review.cons?.map((c, i) => (
                                                    <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 shrink-0" /> {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Message */}
                        <ArticleFooterMessage />

                        {/* Tags Display */}
                        {review.tags && review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-8 mb-8 pt-6 border-t border-[var(--border)]">
                                {review.tags.map((tag, i) => (
                                    <span key={i} className="px-4 py-1.5 text-sm font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-full border border-[var(--border)]">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Mobile Social Share */}
                        <div className="lg:hidden mt-8 p-6 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Share this review</h3>
                            <SocialShare
                                url={`/reviews/${review.slug}`}
                                title={decodeHtml(review.title)}
                                description={decodeHtml(review.excerpt) || ''}
                                vertical={false}
                            />
                        </div>

                        {/* Author Bio Box */}
                        <div className="mt-12 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                            <Link href={`/profile/${review.author?.username}`} className="w-20 h-20 shrink-0 rounded-full border-2 border-[var(--accent)] p-1 hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-card)]">
                                    {review.author?.avatar_url ? (
                                        <Image
                                            src={review.author.avatar_url}
                                            alt={review.author.username}
                                            width={80}
                                            height={80}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[var(--text-primary)]">
                                            {review.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="flex-1">
                                <Link href={`/profile/${review.author?.username}`} className="inline-block group">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                                        About {decodeHtml(review.author?.display_name || review.author?.username || "The Author")}
                                    </h3>
                                </Link>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                                    {decodeHtml(review.author?.bio) || "TechPlay reviewer. Expert in detailed analysis and performance testing."}
                                </p>
                            </div>
                        </div>

                        {/* Related Reviews */}
                        <RelatedArticles
                            articles={(review as any).related_articles || []}
                            title="Slične recenzije"
                            viewAllHref="/reviews"
                            articleBasePath="/reviews"
                        />

                        {/* Comments Section */}
                        <div className="mt-12 pt-12 border-t border-[var(--border)]">
                            <CommentsSection commentableId={review.id} commentableType="review" />
                        </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <aside className="lg:col-span-3 min-w-0 space-y-8 mt-12 lg:mt-0">
                        {/* REVIEW SPECIFIC: Moved to bottom of content per user request */}

                        <AdUnit position="sidebar_top" />

                        <div className="sticky top-24 space-y-8">
                            {toc.length > 0 && (
                                <TableOfContents items={toc} />
                            )}

                            {/* Trending - Dynamic from backend */}
                            <TrendingSidebar />

                            <AdUnit position="sidebar_bottom" />
                        </div>
                    </aside>
                </div>
            </div>
        </article>
    );
}
