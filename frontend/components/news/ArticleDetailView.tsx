"use client";

import { Article } from "@/types";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { processContent } from "@/lib/content";
import { ARTICLE_PROSE, splitForAd, tidyExcerpt } from "@/lib/prose";
import { InArticleAd, DisplayAd } from "@/components/ads/AdSense";
import ReadingProgress from "@/components/ui/ReadingProgress";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import GameInfoCard from "@/components/games/GameInfoCard";
import AdUnit from "@/components/ads/AdUnit";
import SocialShare from "@/components/share/SocialShare";
import RecommendedNews from "@/components/news/RecommendedNews";
import ReadingTracker from "@/components/news/ReadingTracker";
import ReleaseCalendarSection from "@/components/home/ReleaseCalendarSection";
import DiscordWidget from "@/components/home/DiscordWidget";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ArticleFooter from "@/components/ui/ArticleFooter";
import GoogleNewsFollow from "@/components/ui/GoogleNewsFollow";
import { decodeHtml } from "@/lib/decode";

interface ArticleDetailViewProps {
    article: Article;
    initialComments?: any[];
}

const ClientDate = ({ date }: { date: string }) => {
    const [formatted, setFormatted] = useState<string>("");

    useEffect(() => {
        try {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                setFormatted(format(d, 'dd/MM/yyyy'));
            } else {
                setFormatted("Date unavailable");
            }
        } catch (e) {
            setFormatted("Date unavailable");
        }
    }, [date]);

    if (!formatted) return <span className="opacity-0">Loading...</span>;
    return <span>{formatted}</span>;
};

function getVideoEmbed(url: string): { embedUrl: string; thumbnailUrl: string | null } | null {
    try {
        const parsed = new URL(url);

        // YouTube watch page
        if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') {
            if (parsed.pathname === '/watch') {
                const v = parsed.searchParams.get('v');
                if (v) return { embedUrl: `https://www.youtube.com/embed/${v}`, thumbnailUrl: `https://img.youtube.com/vi/${v}/maxresdefault.jpg` };
            }
        }
        // YouTube short URL
        if (parsed.hostname === 'youtu.be') {
            const v = parsed.pathname.slice(1).split('?')[0];
            if (v) return { embedUrl: `https://www.youtube.com/embed/${v}`, thumbnailUrl: `https://img.youtube.com/vi/${v}/maxresdefault.jpg` };
        }
        // Vimeo
        if (parsed.hostname === 'vimeo.com' || parsed.hostname === 'www.vimeo.com') {
            const v = parsed.pathname.split('/').filter(Boolean)[0];
            if (v && /^\d+$/.test(v)) return { embedUrl: `https://player.vimeo.com/video/${v}`, thumbnailUrl: null };
        }
    } catch {
        return null;
    }
    return null;
}

export default function ArticleDetailView({ article, initialComments }: ArticleDetailViewProps) {
    useEmbedScripts();
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const readingTime = useMemo(() => {
        const text = (article.content || '').replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }, [article.content]);

    const { content: processedContent } = useMemo(() => processContent(article.content), [article.content]);
    const [bodyBefore, bodyAfter] = useMemo(() => splitForAd(processedContent), [processedContent]);

    // Every hook has run by here. The guard used to sit above the memo, which
    // is a hook-order mismatch the first time a caller passes a falsy article.
    if (!article) return null;

    const imageUrl = article.featured_image_url?.startsWith('http')
        ? article.featured_image_url
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`;

    const videoEmbed = article.featured_video_url ? getVideoEmbed(article.featured_video_url) : null;
    // Use article image as hero bg; fall back to YouTube auto-thumbnail
    const heroBackground = article.featured_image_url
        ? imageUrl
        : (videoEmbed?.thumbnailUrl ?? null);

    // NOTE: We trust backend-sanitized content and our own processContent transformations
    // DOMPurify was stripping iframe embeds even with ADD_TAGS config
    const safeContent = processedContent;

    return (
        <article className="min-h-screen pb-20">
            <ReadingProgress />

            {/* ── MAIN LAYOUT: Left social bar + content + right sidebar ── */}
            <div className="w-full container-page pt-3 md:pt-4 pb-8 flex gap-8">

                {/* Left Sticky Bar (back) */}
                <aside className="hidden lg:flex flex-col gap-6 sticky top-[140px] shrink-0 h-[max-content]">
                    <Link
                        href="/news"
                        aria-label="Back to news"
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/45 hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </aside>

                {/* Content Wrapper */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Breadcrumbs — the phone's top bar already carries
                        the section and the way back. */}
                    <div className="hidden md:block mb-6 mt-1">
                        <Breadcrumbs
                            items={[
                                { label: 'News', href: '/news' },
                                { label: decodeHtml(article.category?.name) || 'Article', href: `/news/${article.category?.slug || 'gaming'}` },
                                { label: decodeHtml(article.title) }
                            ]}
                        />
                    </div>

                    <div className="flex flex-col xl:flex-row gap-8">
                        {/* Main Content Area */}
                        <div className="flex-1 min-w-0 flex flex-col">

                            {/* Hero Banner */}
                            <div className="relative w-full rounded-[var(--radius-panel)] flex flex-col overflow-hidden bg-[var(--surface-1)] border border-[var(--line)] h-[390px] md:h-[580px]">
                                <div className="relative w-full flex-1 flex flex-col justify-end min-h-0">

                                    {/* Background layer — hidden when video is playing */}
                                    <div className={`absolute inset-0 transition-opacity duration-500 ${isVideoPlaying ? 'opacity-0' : 'opacity-100'}`}>
                                        {heroBackground ? (
                                            <Image
                                                src={heroBackground}
                                                alt={decodeHtml(article.featured_image_alt || article.title)}
                                                fill
                                                className="object-cover object-right"
                                                priority
                                                quality={90}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#0d2444] to-[var(--surface-0)]" />
                                        )}
                                        {/* Left fade */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)]/90 via-[var(--surface-0)]/50 to-transparent w-[65%]" />
                                        {/* Bottom fade */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/60 to-transparent" />
                                    </div>

                                    {/* Video iframe — shown only after play is clicked */}
                                    {videoEmbed && isVideoPlaying && (
                                        <iframe
                                            src={`${videoEmbed.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
                                            className="absolute inset-0 w-full h-full z-20 animate-fadeIn"
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                            title={decodeHtml(article.title)}
                                        />
                                    )}


                                    {/* Left content panel — slides down and fades out when playing */}
                                    <div className={`relative z-10 flex flex-col p-5 md:p-12 w-full md:w-[75%] transition-all duration-500 ${isVideoPlaying ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                                        {/* Category badge */}
                                        <div className="bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-flex w-max mb-3 md:mb-5 leading-none shadow-sm shadow-[var(--accent)]/20">
                                            {decodeHtml(article.category?.name) || "News"}
                                        </div>

                                        {/* Title with 4px orange leftline */}
                                        <div className="flex gap-3 md:gap-4 mb-3 md:mb-4 items-start">
                                            <div className="w-[4px] bg-[var(--accent)] shrink-0 mt-2 self-stretch rounded-sm" />
                                            <h1 className="font-display text-[25px] md:text-[48px] font-bold text-white leading-[1.12] drop-shadow-lg">
                                                {decodeHtml(article.title)}
                                            </h1>
                                        </div>

                                        {/* Watch video button — shown only when video URL is set and not yet playing */}
                                        {videoEmbed && !isVideoPlaying && (
                                            <button
                                                onClick={() => setIsVideoPlaying(true)}
                                                className="mb-5 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white text-[11px] font-bold uppercase tracking-widest transition-all duration-200 w-max shadow-lg shadow-[var(--accent)]/20 group"
                                            >
                                                <Play className="w-3.5 h-3.5 fill-white group-hover:scale-110 transition-transform" />
                                                Watch Video
                                            </button>
                                        )}

                                        {/* Author row */}
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/author/${article.author?.author_slug || article.author?.username || 'me'}`}
                                                aria-label="Author profile"
                                                className="w-[46px] h-[46px] rounded-full overflow-hidden border border-white/10 shrink-0 shadow-sm hover:border-[var(--accent)]/50 transition-colors"
                                            >
                                                {article.author?.avatar_url ? (
                                                    <Image unoptimized
                                                        src={article.author.avatar_url}
                                                        alt={article.author.display_name || article.author.username || "Author"}
                                                        width={46}
                                                        height={46}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                                                        {(article.author?.display_name || article.author?.username || "T").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="flex flex-col">
                                                <span className="text-white/85 font-medium text-[14px]">
                                                    By{" "}
                                                    <Link
                                                        href={`/author/${article.author?.author_slug || article.author?.username || 'me'}`}
                                                        className="font-bold hover:text-[var(--accent)] transition-colors"
                                                    >
                                                        {decodeHtml(article.author?.display_name || article.author?.username || "TechPlay Editor")}
                                                    </Link>
                                                </span>
                                                <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1">
                                                    <ClientDate date={article.published_at || article.created_at} />
                                                    <span className="w-1 h-1 rounded-full bg-white/12" />
                                                    <span>{readingTime.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info bar beneath hero */}
                                <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between border-t border-white/[0.05] bg-[#0A0D12] px-4 md:px-12 py-2.5 gap-2.5 md:gap-3">
                                    <div className="flex items-center flex-wrap gap-3">
                                        <span className="hidden md:inline text-white/50 text-[11px] font-bold uppercase tracking-widest mr-2">CATEGORY:</span>
                                        <span className="inline-flex items-center h-[26px] px-3 rounded-full border border-white/10 text-white text-[10.5px] font-bold uppercase tracking-wider">
                                            {decodeHtml(article.category?.name) || "News"}
                                        </span>
                                    </div>
                                    {/* Save sits last on every template. It led on
                                        news and trailed on reviews, so the one control
                                        a reader is looking for moved depending on
                                        which kind of article they had opened. */}
                                    <div className="flex items-center gap-2.5 flex-nowrap">
                                        <span className="hidden md:inline text-white/50 text-[11px] font-bold uppercase tracking-widest shrink-0">SHARE:</span>
                                        <SocialShare
                                            url={`/news/${article.slug}`}
                                            title={decodeHtml(article.title)}
                                            description={decodeHtml(article.excerpt) || ''}
                                            vertical={false}
                                        />
                                        <ReadingTracker slug={article.slug} />
                                    </div>
                                </div>
                            </div>

                            {/* Article prose */}
                            <div className="flex flex-col lg:flex-row gap-12 mt-6 md:mt-10">

                                {/* Article Prose */}
                                <div className="flex-1 min-w-0">

                                    {/* Intro quote */}
                                    {article.excerpt && (
                                        <div className="bg-[var(--surface-1)] border border-white/[0.07] border-l-[4px] border-l-[var(--accent)] p-4 md:p-8 rounded-r-[16px] rounded-l-[4px] mb-6 md:mb-10 shadow-lg">
                                            <p className="text-[17px] md:text-[26px] font-display italic font-medium text-white leading-snug">
                                                &ldquo;{tidyExcerpt(decodeHtml(article.excerpt))}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* The body, cut once so an ad can sit between
                                        paragraphs rather than after the piece.
                                        Short articles come back in one part and
                                        get no ad at all — a news item of four
                                        paragraphs with a unit halfway down is an
                                        ad with an article around it. */}
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

                                    <GoogleNewsFollow />

                                    <ArticleFooter
                                        author={article.author}
                                        tags={[decodeHtml(article.category?.name), 'Gaming'].filter(Boolean) as string[]}
                                        shareUrl={`/news/${article.slug}`}
                                        shareTitle={decodeHtml(article.title)}
                                        shareDescription={decodeHtml(article.excerpt) || ''}
                                        commentableId={article.id}
                                        commentableType="article"
                                        initialComments={initialComments}
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

                            {article.game && <GameInfoCard game={article.game} />}

                            <RecommendedNews excludeSlug={article.slug} />

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
