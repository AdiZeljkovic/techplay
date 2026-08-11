"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ThumbsUp } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import Script from "next/script";
import { processContent } from "@/lib/content";
import { ARTICLE_PROSE } from "@/lib/prose";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import GameInfoCard from "@/components/games/GameInfoCard";
import AdUnit from "@/components/ads/AdUnit";
import RecommendedNews from "@/components/news/RecommendedNews";
import ReleaseCalendarSection from "@/components/home/ReleaseCalendarSection";
import DiscordWidget from "@/components/home/DiscordWidget";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import ArticleFooter from "@/components/ui/ArticleFooter";
import SocialShare from "@/components/share/SocialShare";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedArticles from "@/components/seo/RelatedArticles";
import { decodeHtml } from "@/lib/decode";
import { Dialog } from "@/components/ui/Dialog";

export interface Guide {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    featured_image_url?: string;
    created_at: string;
    updated_at: string;
    /** The column exists and the detail page reads it; the type simply never said so. */
    published_at?: string | null;
    author: {
        username: string;
        author_slug?: string;
        display_name?: string;
        avatar_url?: string;
        name?: string;
        bio?: string;
    };
    helpful_count: number;
    views?: number;
}

interface GuideDetailViewProps {
    game?: import("@/components/games/GameInfoCard").LinkedGame | null;
    guide: Guide;
    userVote?: boolean | null;
}

export default function GuideDetailView({ guide, game, userVote: initialVote }: GuideDetailViewProps) {
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const { user } = useAuth();
    useEmbedScripts();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Calculate reading time
    const readingTime = useMemo(() => {
        const text = guide.content.replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }, [guide.content]);


    const difficultyColors = {
        beginner: 'text-green-400 border-green-400 bg-green-400/10',
        intermediate: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
        advanced: 'text-red-400 border-red-400 bg-red-400/10' };

    const { content: processedContent } = useMemo(() => processContent(guide.content), [guide.content]);

    const imageUrl = guide.featured_image_url?.startsWith('http')
        ? guide.featured_image_url
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${guide.featured_image_url}`;

    // JSON-LD
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": guide.title,
        "image": imageUrl ? [imageUrl] : [],
        "totalTime": `PT${parseInt(readingTime)}M`,
        "step": [], // Could parse steps if structured
        "author": {
            "@type": "Person",
            "name": guide.author?.display_name || guide.author?.username
        }
    };

    const publishedDate = (() => {
        const d = new Date(guide.created_at);
        return isNaN(d.getTime()) ? 'N/A' : format(d, 'dd/MM/yyyy');
    })();

    return (
        <>
        <article className="min-h-screen pb-20">
            <Script
                id="guide-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── MAIN LAYOUT: Left back bar + content + right sidebar ── */}
            <div className="w-full container-page pt-4 pb-8 flex gap-8">

                {/* Left Sticky Bar (back) */}
                <aside className="hidden lg:flex flex-col gap-6 sticky top-[140px] shrink-0 h-[max-content]">
                    <Link
                        href="/guides"
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
                                { label: 'Guides', href: '/guides' },
                                { label: decodeHtml(guide.title) }
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
                                        {guide.featured_image_url ? (
                                            <Image
                                                src={imageUrl!}
                                                alt={decodeHtml(guide.title)}
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
                                        {/* Difficulty badge */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-flex w-max leading-none shadow-sm shadow-[var(--accent)]/20">
                                                GUIDE
                                            </div>
                                            <span className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${difficultyColors[guide.difficulty]}`}>
                                                {guide.difficulty}
                                            </span>
                                        </div>

                                        {/* Title with 4px orange leftline */}
                                        <div className="flex gap-4 mb-4 items-start">
                                            <div className="w-[4px] bg-[var(--accent)] shrink-0 mt-2 self-stretch rounded-sm" />
                                            <h1 className="font-display text-[32px] md:text-[48px] font-bold text-white leading-[1.1] drop-shadow-lg">
                                                {decodeHtml(guide.title)}
                                            </h1>
                                        </div>

                                        {/* Excerpt */}
                                        {guide.excerpt && (
                                            <p className="text-[15px] md:text-[18px] text-white/45 leading-relaxed mb-8 max-w-xl">
                                                {decodeHtml(guide.excerpt)}
                                            </p>
                                        )}

                                        {/* Author row */}
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/author/${guide.author?.author_slug || guide.author?.username || 'me'}`}
                                                className="w-[46px] h-[46px] rounded-full overflow-hidden border border-white/10 shrink-0 shadow-sm hover:border-[var(--accent)]/50 transition-colors"
                                            >
                                                {guide.author?.avatar_url ? (
                                                    <Image unoptimized
                                                        src={guide.author.avatar_url}
                                                        alt={guide.author.display_name || guide.author.username || "Author"}
                                                        width={46}
                                                        height={46}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                                                        {(guide.author?.display_name || guide.author?.username || "T").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="flex flex-col">
                                                <span className="text-white/85 font-medium text-[14px]">
                                                    By{" "}
                                                    <Link
                                                        href={`/author/${guide.author?.author_slug || guide.author?.username || 'me'}`}
                                                        className="font-bold hover:text-[var(--accent)] transition-colors"
                                                    >
                                                        {decodeHtml(guide.author?.display_name || guide.author?.username || "TechPlay Editor")}
                                                    </Link>
                                                </span>
                                                <div className="flex items-center gap-2 text-white/35 text-[11px] font-bold uppercase tracking-widest mt-1">
                                                    <span>{publishedDate}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/12" />
                                                    <span>{readingTime.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info bar beneath hero */}
                                <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between border-t border-white/[0.05] bg-[#0A0D12] px-8 md:px-12 py-4 gap-4">
                                    <div className="flex items-center flex-wrap gap-3">
                                        <span className="text-white/35 text-[11px] font-bold uppercase tracking-widest mr-2">HELPFUL:</span>
                                        <span className="bg-transparent border border-white/10 px-4 py-1.5 rounded-full text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                            {guide.helpful_count} FOUND HELPFUL
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white/35 text-[11px] font-bold uppercase tracking-widest">SHARE:</span>
                                        <SocialShare
                                            url={`/guides/${guide.slug}`}
                                            title={decodeHtml(guide.title)}
                                            description={decodeHtml(guide.excerpt) || ''}
                                            vertical={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Article prose */}
                            <div className="flex flex-col lg:flex-row gap-12 mt-10">
                                <div className="flex-1 min-w-0">

                                    {/* Intro quote */}
                                    {guide.excerpt && (
                                        <div className="bg-[var(--surface-1)] border border-white/[0.07] border-l-[4px] border-l-[var(--accent)] p-6 md:p-8 rounded-r-[16px] rounded-l-[4px] mb-10 shadow-lg">
                                            <p className="text-[22px] md:text-[26px] font-display italic font-medium text-white leading-snug">
                                                &ldquo;{decodeHtml(guide.excerpt)}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* Main prose content */}
                                    <div
                                        className={ARTICLE_PROSE}
                                        dangerouslySetInnerHTML={{ __html: processedContent }}
                                    />

                                    {/* Mid-Article Ad */}
                                    <div className="my-12 xl:hidden">
                                        <AdUnit position="article_mid" />
                                    </div>

                                    <ArticleFooter
                                        author={guide.author}
                                        tags={guide.difficulty ? [guide.difficulty] : []}
                                        shareUrl={`/guides/${guide.slug}`}
                                        shareTitle={decodeHtml(guide.title)}
                                        shareDescription={decodeHtml(guide.excerpt) || ''}
                                        commentableId={guide.id}
                                        commentableType="guide"
                                    />

                                    {/* Related Guides */}
                                    <RelatedArticles
                                        articles={(guide as any).related_articles || []}
                                        title="Slični vodiči"
                                        viewAllHref="/guides"
                                        articleBasePath="/guides"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="hidden xl:flex flex-col gap-5 w-[340px] shrink-0">
                            <AdUnit position="sidebar_top" />

                            {game && <GameInfoCard game={game} />}

                            <RecommendedNews />

                                                        <ReleaseCalendarSection />

                            <DiscordWidget />

                            <AdUnit position="sidebar_bottom" />
                        </aside>
                    </div>
                </div>
            </div>

        </article>

        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-8 max-w-sm w-full shadow-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Login to vote</h3>
                <p className="text-white/45 text-sm mb-6">
                    Create a free account to rate guides and help the community find the best content.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="flex-1 py-2.5 px-4 rounded-[var(--radius-card)] border border-white/[0.07] text-white/45 text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                        Maybe later
                    </button>
                    <Link
                        href="/login"
                        className="flex-1 py-2.5 px-4 rounded-[var(--radius-card)] bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors text-center"
                        onClick={() => setShowLoginPrompt(false)}
                    >
                        Login
                    </Link>
                </div>
            </div>
        </Dialog>
        </>
    );
}
