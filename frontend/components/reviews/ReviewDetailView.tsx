"use client";

import { Review } from "@/types";
import Link from "next/link";
import { ArrowLeft, Check, X, Star } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useMemo } from "react";
import Script from "next/script";
import AdUnit from "@/components/ads/AdUnit";
import ReviewSidebar from "@/components/reviews/ReviewSidebar";
import RecommendedNews from "@/components/news/RecommendedNews";
import ReleaseCalendarSection from "@/components/home/ReleaseCalendarSection";
import DiscordWidget from "@/components/home/DiscordWidget";
import { Article } from "@/types";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedArticles from "@/components/seo/RelatedArticles";
import { processContent } from "@/lib/content";
import { ARTICLE_PROSE } from "@/lib/prose";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import ArticleFooter from "@/components/ui/ArticleFooter";
import SocialShare from "@/components/share/SocialShare";
import { decodeHtml } from "@/lib/decode";

interface ReviewDetailViewProps {
    review: Review;
}

export default function ReviewDetailView({ review }: ReviewDetailViewProps) {
    useEmbedScripts();

    // Calculate reading time
    const readingTime = useMemo(() => {
        const text = (review.content || '').replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }, [review.content]);

    if (!review) return null;

    const displayScore = Number(review.review_score ?? review.rating ?? 0);
    const ratingColor = displayScore >= 8 ? "text-green-500 border-green-500" : displayScore >= 6 ? "text-yellow-500 border-yellow-500" : "text-red-500 border-red-500";

    // JSON-LD: Product with review (Google requires review/offers/aggregateRating on Product)
    const ratingValue = Number(review.review_score ?? review.rating ?? 0);
    const reviewObj: Record<string, any> = {
        "@type": "Review",
        "headline": review.seo_title || review.title,
        "author": {
            "@type": "Person",
            "name": review.author?.display_name || review.author?.username || "TechPlay Reviewer",
            "url": `${process.env.NEXT_PUBLIC_APP_URL}/author/${review.author?.author_slug || review.author?.username}`
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

    const { content: processedContent } = useMemo(() => processContent(review.content || ''), [review.content]);

    const imageUrl = (review.cover_image || review.featured_image_url)
        ? ((review.cover_image || review.featured_image_url)!.startsWith('http')
            ? (review.cover_image || review.featured_image_url)!
            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${review.cover_image || review.featured_image_url}`)
        : null;

    const publishedDate = (() => {
        const d = new Date(review.published_at || review.created_at);
        return isNaN(d.getTime()) ? 'N/A' : format(d, 'dd/MM/yyyy');
    })();

    return (
        <article className="min-h-screen pb-20">
            <Script
                id="review-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── MAIN LAYOUT: Left back bar + content + right sidebar ── */}
            <div className="w-full max-w-[1500px] mx-auto px-4 xl:px-8 pt-4 pb-8 flex gap-8">

                {/* Left Sticky Bar (back) */}
                <aside className="hidden lg:flex flex-col gap-6 sticky top-[140px] shrink-0 h-[max-content]">
                    <Link
                        href="/reviews"
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-[#A1A1AA] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </aside>

                {/* Content Wrapper */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Breadcrumbs */}
                    <div className="mb-6 mt-1">
                        <Breadcrumbs
                            items={[
                                { label: 'Reviews', href: '/reviews' },
                                { label: decodeHtml(review.category?.name) || 'Review', href: '/reviews' },
                                { label: decodeHtml(review.title) }
                            ]}
                        />
                    </div>

                    <div className="flex flex-col xl:flex-row gap-8">
                        {/* Main Content Area */}
                        <div className="flex-1 min-w-0 flex flex-col">

                            {/* Hero Banner */}
                            <div className="relative w-full rounded-[24px] flex flex-col overflow-hidden bg-[#0B0E14] border border-[#161B22] h-[580px]">
                                <div className="relative w-full flex-1 flex flex-col justify-end min-h-0">
                                    <div className="absolute inset-0">
                                        {imageUrl ? (
                                            <Image
                                                src={imageUrl}
                                                alt={decodeHtml(review.title)}
                                                fill
                                                className="object-cover object-right opacity-80"
                                                priority
                                                quality={90}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#0d2444] to-[#05070A]" />
                                        )}
                                        {/* Left fade — shows image on right */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#05070A] via-[#05070A]/95 to-transparent w-[85%]" />
                                        {/* Bottom fade */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/60 to-transparent" />
                                    </div>

                                    {/* Left content panel */}
                                    <div className="relative z-10 flex flex-col p-8 md:p-12 w-full md:w-[75%]">
                                        {/* Category badge + score */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-flex w-max leading-none shadow-sm shadow-[var(--accent)]/20">
                                                {decodeHtml(review.category?.name) || "Review"}
                                            </div>
                                            {displayScore > 0 && (
                                                <div className={`px-3 py-1 rounded-full border ${ratingColor} bg-black/50 backdrop-blur text-sm font-bold flex items-center gap-2`}>
                                                    <Star className={`w-4 h-4 ${ratingColor.split(' ')[0]} fill-current`} />
                                                    <span className="text-white">{displayScore.toFixed(1)}/10</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Title with 4px orange leftline */}
                                        <div className="flex gap-4 mb-4 items-start">
                                            <div className="w-[4px] bg-[var(--accent)] shrink-0 mt-2 self-stretch rounded-sm" />
                                            <h1 className="font-display text-[32px] md:text-[48px] font-bold text-white leading-[1.1] drop-shadow-lg">
                                                {decodeHtml(review.title)}
                                            </h1>
                                        </div>

                                        {/* Excerpt */}
                                        {(review.excerpt || review.summary) && (
                                            <p className="text-[15px] md:text-[18px] text-[#A1A1AA] leading-relaxed mb-8 max-w-xl">
                                                {decodeHtml(review.excerpt || review.summary)}
                                            </p>
                                        )}

                                        {/* Author row */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-[46px] h-[46px] rounded-full overflow-hidden border border-white/10 shrink-0 shadow-sm">
                                                {review.author?.avatar_url ? (
                                                    <Image
                                                        src={review.author.avatar_url}
                                                        alt={review.author.display_name || review.author.username || "Author"}
                                                        width={46}
                                                        height={46}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[#1A1F26] flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                                                        {(review.author?.display_name || review.author?.username || "T").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[#E4E4E5] font-medium text-[14px]">
                                                    By <strong>{decodeHtml(review.author?.display_name || review.author?.username || "TechPlay Reviewer")}</strong>
                                                </span>
                                                <div className="flex items-center gap-2 text-[#71717A] text-[11px] font-bold uppercase tracking-widest mt-1">
                                                    <span>{publishedDate}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#3F3F46]" />
                                                    <span>{readingTime.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info bar beneath hero */}
                                <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between border-t border-white/[0.05] bg-[#0A0D12] px-8 md:px-12 py-4 gap-4">
                                    <div className="flex items-center flex-wrap gap-3">
                                        <span className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest mr-2">CATEGORY:</span>
                                        <span className="bg-transparent border border-white/10 px-4 py-1.5 rounded-full text-white text-[11px] font-bold uppercase tracking-wider">
                                            {decodeHtml(review.category?.name) || "Review"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest">SHARE:</span>
                                        <SocialShare
                                            url={`/reviews/${review.slug}`}
                                            title={decodeHtml(review.title)}
                                            description={decodeHtml(review.excerpt) || ''}
                                            vertical={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Article prose */}
                            <div className="flex flex-col lg:flex-row gap-12 mt-10">
                                <div className="flex-1 min-w-0">

                                    {/* Intro quote */}
                                    {review.summary && (
                                        <div className="bg-[#0B0E14] border border-[#161B22] border-l-[4px] border-l-[var(--accent)] p-6 md:p-8 rounded-r-[16px] rounded-l-[4px] mb-10 shadow-lg">
                                            <p className="text-[22px] md:text-[26px] font-display italic font-medium text-white leading-snug">
                                                &ldquo;{decodeHtml(review.summary)}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* Main prose content */}
                                    {processedContent ? (
                                        <div
                                            className={ARTICLE_PROSE}
                                            dangerouslySetInnerHTML={{ __html: processedContent }}
                                        />
                                    ) : (
                                        <div className="py-20 text-center text-[#A1A1AA]">
                                            <p className="italic">No written review content available.</p>
                                        </div>
                                    )}

                                    {/* Mid-Article Ad */}
                                    <div className="my-12 xl:hidden">
                                        <AdUnit position="article_mid" />
                                    </div>

                                    {/* REVIEW SUMMARY & SCORES */}
                                    <div className="my-12">
                                        {review.review_data ? (
                                            <ReviewSidebar article={review as unknown as Article} />
                                        ) : (
                                            /* Legacy Fallback for Reviews without new data structure */
                                            <div className="bg-[#0B0E14] border border-[#161B22] rounded-2xl p-6 shadow-lg text-center">
                                                <div className={`w-32 h-32 mx-auto rounded-full border-4 ${ratingColor} bg-[#0B0E14] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
                                                    <span className={`text-5xl font-bold ${ratingColor.split(' ')[0]}`}>{review.rating}</span>
                                                </div>
                                                <p className="text-[#71717A] font-medium uppercase tracking-widest text-sm mb-6">Overall Score</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                                    <div>
                                                        <h4 className="text-green-500 font-bold text-sm mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> The Good</h4>
                                                        <ul className="space-y-2">
                                                            {review.pros?.map((p, i) => (
                                                                <li key={i} className="text-sm text-[#A1A1AA] flex gap-2">
                                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0" /> {p}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-red-500 font-bold text-sm mb-3 flex items-center gap-2"><X className="w-4 h-4" /> The Bad</h4>
                                                        <ul className="space-y-2">
                                                            {review.cons?.map((c, i) => (
                                                                <li key={i} className="text-sm text-[#A1A1AA] flex gap-2">
                                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 shrink-0" /> {c}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <ArticleFooter
                                        author={review.author}
                                        tags={review.tags || []}
                                        shareUrl={`/reviews/${review.slug}`}
                                        shareTitle={decodeHtml(review.title)}
                                        shareDescription={decodeHtml(review.excerpt) || ''}
                                        commentableId={review.id}
                                        commentableType="review"
                                    />

                                    {/* Related Reviews */}
                                    <RelatedArticles
                                        articles={(review as any).related_articles || []}
                                        title="Slične recenzije"
                                        viewAllHref="/reviews"
                                        articleBasePath="/reviews"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="hidden xl:flex flex-col gap-8 w-[340px] shrink-0">
                            <AdUnit position="sidebar_top" />

                            <RecommendedNews />

                            {/* Wrapper divs neutralize the widgets' h-full (meant for homepage grid rows) */}
                            <div><ReleaseCalendarSection /></div>

                            <div><DiscordWidget /></div>

                            <AdUnit position="sidebar_bottom" />
                        </aside>
                    </div>
                </div>
            </div>

        </article>
    );
}
