"use client";

import { Article } from "@/types";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { processContent } from "@/lib/content";
import { ARTICLE_PROSE } from "@/lib/prose";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import AdUnit from "@/components/ads/AdUnit";
import SocialShare from "@/components/share/SocialShare";
import CommentsSection from "@/components/comments/CommentsSection";
import RecommendedNews from "@/components/news/RecommendedNews";
import ReleaseCalendarSection from "@/components/home/ReleaseCalendarSection";
import DiscordWidget from "@/components/home/DiscordWidget";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedArticles from "@/components/seo/RelatedArticles";
import ArticleFooterMessage from "@/components/ui/ArticleFooterMessage";
import AuthorBio from "@/components/ui/AuthorBio";
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

export default function ArticleDetailView({ article, initialComments }: ArticleDetailViewProps) {
    useEmbedScripts();

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
                                <div className="relative w-full flex-1 flex flex-col justify-center min-h-0">
                                    <div className="absolute inset-0">
                                        {article.featured_image_url ? (
                                            <Image
                                                src={imageUrl!}
                                                alt={decodeHtml(article.title)}
                                                fill
                                                className="object-cover object-right opacity-100"
                                                priority
                                                quality={90}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#0d2444] to-[#05070A]" />
                                        )}
                                        {/* Left fade — shows image on right */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#05070A] via-[#05070A]/80 to-transparent w-[70%]" />
                                        {/* Bottom fade */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A]/80 via-[#05070A]/20 to-transparent" />
                                    </div>

                                    {/* Left content panel */}
                                    <div className="relative z-10 flex flex-col justify-center p-8 md:p-12 w-full md:w-[70%]">
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

                                        {/* Author row */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-[46px] h-[46px] rounded-full overflow-hidden border border-white/10 shrink-0 shadow-sm">
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
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[#E4E4E5] font-medium text-[14px]">
                                                    By <strong>{decodeHtml(article.author?.display_name || article.author?.username || "TechPlay Editor")}</strong>
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
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[#71717A] text-[11px] font-bold uppercase tracking-widest">SHARE:</span>
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

                                    <ArticleFooterMessage />

                                    {/* Tags Footer */}
                                    <div className="mt-12 pt-8 border-t border-[#161B22] flex flex-wrap gap-2">
                                        <span className="text-sm font-semibold text-white mr-2">Tags:</span>
                                        <span className="px-3 py-1 bg-[#0B0E14] text-[#A1A1AA] text-sm rounded-lg hover:text-[var(--accent)] hover:border-[var(--accent)] border border-[#161B22] transition-all cursor-pointer">
                                            {decodeHtml(article.category?.name)}
                                        </span>
                                        <span className="px-3 py-1 bg-[#0B0E14] text-[#A1A1AA] text-sm rounded-lg hover:text-[var(--accent)] hover:border-[var(--accent)] border border-[#161B22] transition-all cursor-pointer">
                                            Gaming
                                        </span>
                                    </div>

                                    {/* Mobile Social Share */}
                                    <div className="lg:hidden mt-8 p-6 bg-[#0B0E14] border border-[#161B22] rounded-2xl">
                                        <h3 className="text-sm font-semibold text-white mb-4 text-center">Share this article</h3>
                                        <SocialShare
                                            url={`/news/${article.slug}`}
                                            title={decodeHtml(article.title)}
                                            description={decodeHtml(article.excerpt) || ''}
                                            vertical={false}
                                        />
                                    </div>

                                    {/* Author Bio */}
                                    <AuthorBio author={article.author} />

                                    {/* Comments */}
                                    <div className="mt-12 pt-12 border-t border-[#161B22]">
                                        <CommentsSection
                                            commentableId={article.id}
                                            commentableType="article"
                                            initialComments={initialComments}
                                        />
                                    </div>

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
