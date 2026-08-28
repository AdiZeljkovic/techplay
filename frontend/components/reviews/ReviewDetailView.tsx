"use client";

import { Review } from "@/types";
import Link from "next/link";
import { ArrowLeft, Check, X, Star } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useMemo, useEffect } from "react";
import Script from "next/script";
import GameInfoCard from "@/components/games/GameInfoCard";
import AdUnit from "@/components/ads/AdUnit";
import ReviewSidebar from "@/components/reviews/ReviewSidebar";
import RecommendedNews from "@/components/news/RecommendedNews";
import ReleaseCalendarSection from "@/components/home/ReleaseCalendarSection";
import DiscordWidget from "@/components/home/DiscordWidget";
import { Article } from "@/types";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { processContent } from "@/lib/content";
import { ARTICLE_PROSE, splitForAd } from "@/lib/prose";
import { InArticleAd, DisplayAd } from "@/components/ads/AdSense";
import { getScoreMeta } from "@/lib/score";
import ReadingProgress from "@/components/ui/ReadingProgress";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import ArticleFooter from "@/components/ui/ArticleFooter";
import SocialShare from "@/components/share/SocialShare";
import ReadingTracker from "@/components/news/ReadingTracker";
import { decodeHtml } from "@/lib/decode";

interface ReviewDetailViewProps {
    review: Review;
}

export default function ReviewDetailView({ review }: ReviewDetailViewProps) {
    useEmbedScripts();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Calculate reading time
    const readingTime = useMemo(() => {
        const text = (review.content || '').replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }, [review.content]);


    const displayScore = Number(review.review_score ?? review.rating ?? 0);
    /* The same bands the cards use. This page carried its own ternary in Tailwind
       classes, which is how the home page and a review ended up disagreeing about
       the colour of the identical number. */
    const scoreMeta = getScoreMeta(displayScore);

    // JSON-LD: Product with review (Google requires review/offers/aggregateRating on Product)
    const ratingValue = Number(review.review_score ?? review.rating ?? 0);
    const reviewObj: Record<string, any> = {
        "@type": "Review",
        "headline": review.meta_title || review.title,
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

    const { content: processedContent } = useMemo(() => processContent(review?.content || ''), [review?.content]);
    const [bodyBefore, bodyAfter] = useMemo(() => splitForAd(processedContent), [processedContent]);

    // Every hook has run by here.
    if (!review) return null;

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
            <ReadingProgress />
            <Script
                id="review-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── MAIN LAYOUT: Left back bar + content + right sidebar ── */}
            <div className="w-full container-page pt-4 pb-8 flex gap-8">

                {/* Left Sticky Bar (back) */}
                <aside className="hidden lg:flex flex-col gap-6 sticky top-[140px] shrink-0 h-[max-content]">
                    <Link
                        href="/reviews"
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/45 hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
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
                            <div className="relative w-full rounded-[24px] flex flex-col overflow-hidden bg-[var(--surface-1)] border border-white/[0.07] h-[580px]">
                                <div className="relative w-full flex-1 flex flex-col justify-end min-h-0">
                                    <div className="absolute inset-0">
                                        {imageUrl ? (
                                            <Image
                                                src={imageUrl}
                                                alt={decodeHtml(review.featured_image_alt || review.title)}
                                                fill
                                                className="object-cover object-right opacity-80"
                                                priority
                                                quality={90}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#0d2444] to-[var(--surface-0)]" />
                                        )}
                                        {/* Left fade — shows image on right */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] via-[var(--surface-0)]/95 to-transparent w-[85%]" />
                                        {/* Bottom fade */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/60 to-transparent" />
                                    </div>

                                    {/* Left content panel */}
                                    <div className="relative z-10 flex flex-col p-8 md:p-12 w-full md:w-[75%]">
                                        {/* Category badge + score */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-flex w-max leading-none shadow-sm shadow-[var(--accent)]/20">
                                                {decodeHtml(review.category?.name) || "Review"}
                                            </div>
                                            {displayScore > 0 && (
                                                <div
                                                    className="px-3 py-1 rounded-full border bg-black/50 backdrop-blur text-sm font-bold flex items-center gap-2"
                                                    style={{ color: scoreMeta.color, borderColor: scoreMeta.color }}
                                                >
                                                    <Star className="w-4 h-4 fill-current" style={{ color: scoreMeta.color }} />
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
                                            <p className="text-[15px] md:text-[18px] text-white/45 leading-relaxed mb-8 max-w-xl">
                                                {decodeHtml(review.excerpt || review.summary)}
                                            </p>
                                        )}

                                        {/* Author row */}
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/author/${review.author?.author_slug || review.author?.username || 'me'}`}
                                                aria-label="Author profile"
                                                className="w-[46px] h-[46px] rounded-full overflow-hidden border border-white/10 shrink-0 shadow-sm hover:border-[var(--accent)]/50 transition-colors"
                                            >
                                                {review.author?.avatar_url ? (
                                                    <Image unoptimized
                                                        src={review.author.avatar_url}
                                                        alt={review.author.display_name || review.author.username || "Author"}
                                                        width={46}
                                                        height={46}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                                                        {(review.author?.display_name || review.author?.username || "T").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="flex flex-col">
                                                <span className="text-white/85 font-medium text-[14px]">
                                                    By{" "}
                                                    <Link
                                                        href={`/author/${review.author?.author_slug || review.author?.username || 'me'}`}
                                                        className="font-bold hover:text-[var(--accent)] transition-colors"
                                                    >
                                                        {decodeHtml(review.author?.display_name || review.author?.username || "TechPlay Reviewer")}
                                                    </Link>
                                                </span>
                                                <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1">
                                                    <span>{publishedDate}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/12" />
                                                    <span>{readingTime.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info bar beneath hero */}
                                <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between border-t border-white/[0.05] bg-[#0A0D12] px-8 md:px-12 py-2.5 gap-3">
                                    <div className="flex items-center flex-wrap gap-3">
                                        <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest mr-2">CATEGORY:</span>
                                        <span className="inline-flex items-center h-[26px] px-3 rounded-full border border-white/10 text-white text-[10.5px] font-bold uppercase tracking-wider">
                                            {decodeHtml(review.category?.name) || "Review"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">SHARE:</span>
                                        <SocialShare
                                            url={`/reviews/${review.slug}`}
                                            title={decodeHtml(review.title)}
                                            description={decodeHtml(review.excerpt) || ''}
                                            vertical={false}
                                        />
                                        {/* Reviews are Article rows like any other, but this had only
                                            ever been mounted on the news template — so nothing a reader
                                            got through in a review was recorded, and the feed could not
                                            learn from it. */}
                                        <ReadingTracker slug={review.slug} />
                                    </div>
                                </div>
                            </div>

                            {/* Article prose */}
                            <div className="flex flex-col lg:flex-row gap-12 mt-10">
                                <div className="flex-1 min-w-0">

                                    {/* Intro quote */}
                                    {review.summary && (
                                        <div className="bg-[var(--surface-1)] border border-white/[0.07] border-l-[4px] border-l-[var(--accent)] p-6 md:p-8 rounded-r-[16px] rounded-l-[4px] mb-10 shadow-lg">
                                            <p className="text-[22px] md:text-[26px] font-display italic font-medium text-white leading-snug">
                                                &ldquo;{decodeHtml(review.summary)}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* The body, cut once so an ad can sit between
                                        paragraphs rather than after the piece.
                                        Short articles come back in one part and
                                        get no ad at all — a news item of four
                                        paragraphs with a unit halfway down is an
                                        ad with an article around it. */}
                                    {processedContent ? (
                                        <>
                                            <div id="article-body">
                                            <div
                                                className={ARTICLE_PROSE}
                                                dangerouslySetInnerHTML={{ __html: bodyBefore }}
                                            />
                                            {bodyAfter !== null && (
                                                <>
                                                    <InArticleAd />
                                                    <div
                                                        className={ARTICLE_PROSE}
                                                        dangerouslySetInnerHTML={{ __html: bodyAfter }}
                                                    />
                                                </>
                                            )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-20 text-center text-white/45">
                                            <p className="italic">No written review content available.</p>
                                        </div>
                                    )}

                                    {/* Mid-Article Ad */}
                                    <div className="my-12 xl:hidden">
                                        <AdUnit position="article_mid" />
                                    </div>

                                    {/* The rail carries a display unit and the
                                        rail is desktop-only, so a phone was
                                        reading the same article with one ad
                                        fewer than a desktop. This is that unit,
                                        after the piece rather than beside it. */}
                                    <DisplayAd className="xl:hidden mb-10" minHeight={250} />

                                    {/* REVIEW SUMMARY & SCORES */}
                                    <div className="my-12">
                                        {review.review_data ? (
                                            <ReviewSidebar article={review as unknown as Article} />
                                        ) : (
                                            /* Legacy Fallback for Reviews without new data structure */
                                            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6 shadow-lg text-center">
                                                <div
                                                    className="w-32 h-32 mx-auto rounded-full border-4 bg-[var(--surface-1)] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                                                    style={{ borderColor: scoreMeta.color }}
                                                >
                                                    <span className="text-5xl font-bold" style={{ color: scoreMeta.color }}>{review.rating}</span>
                                                </div>
                                                <p className="text-white/35 font-medium uppercase tracking-widest text-sm mb-6">Overall Score</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                                    <div>
                                                        <h4 className="text-green-500 font-bold text-sm mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> The Good</h4>
                                                        <ul className="space-y-2">
                                                            {review.pros?.map((p, i) => (
                                                                <li key={i} className="text-sm text-white/45 flex gap-2">
                                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0" /> {p}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-red-500 font-bold text-sm mb-3 flex items-center gap-2"><X className="w-4 h-4" /> The Bad</h4>
                                                        <ul className="space-y-2">
                                                            {review.cons?.map((c, i) => (
                                                                <li key={i} className="text-sm text-white/45 flex gap-2">
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
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="hidden xl:flex flex-col gap-5 w-[340px] shrink-0">
                            <AdUnit position="sidebar_top" />

                            {/* Under any house campaign, above the editorial
                                panels: the rail's first screen, which is the
                                only part of a sticky column anybody sees. */}
                            <DisplayAd />

                            {review.game && <GameInfoCard game={review.game} />}

                            <RecommendedNews />

                                                        <ReleaseCalendarSection />

                            <DiscordWidget />

                            <AdUnit position="sidebar_bottom" />
                        </aside>
                    </div>
                </div>
            </div>

        </article>
    );
}
