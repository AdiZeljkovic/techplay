"use client";

import { Article } from "@/types";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Play } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { processContent } from "@/lib/content";
import { ARTICLE_PROSE } from "@/lib/prose";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import AdUnit from "@/components/ads/AdUnit";
import SocialShare from "@/components/share/SocialShare";
import RecommendedNews from "@/components/news/RecommendedNews";
import ReleaseCalendarSection from "@/components/home/ReleaseCalendarSection";
import DiscordWidget from "@/components/home/DiscordWidget";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedArticles from "@/components/seo/RelatedArticles";
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

    if (!article) return null;

    const { content: processedContent } = useMemo(() => processContent(article.content), [article.content]);

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

            {/* ── MAIN LAYOUT: Left social bar + content + right sidebar ── */}
            <div className="w-full max-w-[1500px] mx-auto px-4 xl:px-8 pt-4 pb-8 flex gap-8">

                {/* Left Sticky Bar (back) */}
                <aside className="hidden lg:flex flex-col gap-6 sticky top-[140px] shrink-0 h-[max-content]">
                    <Link
                        href="/news"
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
                            <div className="relative w-full rounded-[24px] flex flex-col overflow-hidden bg-[#0B0E14] border border-[#161B22] h-[580px]">
                                <div className="relative w-full flex-1 flex flex-col justify-end min-h-0">

                                    {/* Background layer — hidden when video is playing */}
                                    <div className={`absolute inset-0 transition-opacity duration-500 ${isVideoPlaying ? 'opacity-0' : 'opacity-100'}`}>
                                        {heroBackground ? (
                                            <Image
                                                src={heroBackground}
                                                alt={decodeHtml(article.title)}
                                                fill
                                                className="object-cover object-right"
                                                priority
                                                quality={90}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#0d2444] to-[#05070A]" />
                                        )}
                                        {/* Left fade */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/90 via-[#05070A]/50 to-transparent w-[65%]" />
                                        {/* Bottom fade */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/60 to-transparent" />
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
                                    <div className={`relative z-10 flex flex-col p-8 md:p-12 w-full md:w-[75%] transition-all duration-500 ${isVideoPlaying ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                                        {/* Category badge */}
                                        <div className="bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-flex w-max mb-5 leading-none shadow-sm shadow-[var(--accent)]/20">
                                            {decodeHtml(article.category?.name) || "News"}
                                        </div>

                                        {/* Title with 4px orange leftline */}
                                        <div className="flex gap-4 mb-4 items-start">
                                            <div className="w-[4px] bg-[var(--accent)] shrink-0 mt-2 self-stretch rounded-sm" />
                                            <h1 className="font-display text-[32px] md:text-[48px] font-bold text-white leading-[1.1] drop-shadow-lg">
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
                                                className="w-[46px] h-[46px] rounded-full overflow-hidden border border-white/10 shrink-0 shadow-sm hover:border-[var(--accent)]/50 transition-colors"
                                            >
                                                {article.author?.avatar_url ? (
                                                    <Image
                                                        src={article.author.avatar_url}
                                                        alt={article.author.display_name || article.author.username || "Author"}
                                                        width={46}
                                                        height={46}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[#1A1F26] flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                                                        {(article.author?.display_name || article.author?.username || "T").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="flex flex-col">
                                                <span className="text-[#E4E4E5] font-medium text-[14px]">
                                                    By{" "}
                                                    <Link
                                                        href={`/author/${article.author?.author_slug || article.author?.username || 'me'}`}
                                                        className="font-bold hover:text-[var(--accent)] transition-colors"
                                                    >
                                                        {decodeHtml(article.author?.display_name || article.author?.username || "TechPlay Editor")}
                                                    </Link>
                                                </span>
                                                <div className="flex items-center gap-2 text-[#71717A] text-[11px] font-bold uppercase tracking-widest mt-1">
                                                    <ClientDate date={article.published_at || article.created_at} />
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
                                            {decodeHtml(article.category?.name) || "News"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-nowrap">
                                        <span className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest shrink-0">SHARE:</span>
                                        <SocialShare
                                            url={`/news/${article.slug}`}
                                            title={decodeHtml(article.title)}
                                            description={decodeHtml(article.excerpt) || ''}
                                            vertical={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Article prose */}
                            <div className="flex flex-col lg:flex-row gap-12 mt-10">

                                {/* Article Prose */}
                                <div className="flex-1 min-w-0">

                                    {/* Intro quote */}
                                    {article.excerpt && (
                                        <div className="bg-[#0B0E14] border border-[#161B22] border-l-[4px] border-l-[var(--accent)] p-6 md:p-8 rounded-r-[16px] rounded-l-[4px] mb-10 shadow-lg">
                                            <p className="text-[22px] md:text-[26px] font-display italic font-medium text-white leading-snug">
                                                &ldquo;{decodeHtml(article.excerpt)}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* Main prose content */}
                                    <div
                                        className={ARTICLE_PROSE}
                                        dangerouslySetInnerHTML={{ __html: safeContent }}
                                    />

                                    {/* Mid-Article Ad */}
                                    <div className="my-12 xl:hidden">
                                        <AdUnit position="article_mid" />
                                    </div>

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

                                    <RelatedArticles
                                        articles={(article as any).related_articles || []}
                                        title="Slični članci"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="hidden xl:flex flex-col gap-8 w-[340px] shrink-0">
                            <AdUnit position="sidebar_top" />

                            <RecommendedNews excludeSlug={article.slug} />

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
