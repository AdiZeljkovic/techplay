"use client";

import { Article } from "@/types";
import Link from "next/link";
import { ArrowLeft, Clock, Facebook, Linkedin, Twitter, Share2, Calendar, User, Eye } from "lucide-react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import Script from "next/script";
import { useMemo, useState, useEffect } from "react";
import { processContent } from "@/lib/content";
import TableOfContents from "@/components/ui/TableOfContents";
import AdUnit from "@/components/ads/AdUnit";
import CommentsSection from "@/components/comments/CommentsSection";
import DOMPurify from "isomorphic-dompurify";
import LiveViewCount from "@/components/tracking/LiveViewCount";
import TrendingSidebar from "@/components/news/TrendingSidebar";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedArticles from "@/components/seo/RelatedArticles";

interface ArticleDetailViewProps {
    article: Article;
    initialComments?: any[]; // Using any[] temporarily or importing Comment type if available in scope
}

// Importing Comment/User type might be needed if not fully available? 
// The file imports { Article } from "@/types";
// Let's assume Comment is in "@/types" too or locally defined.
// The previous file defined Comment locally in CommentsSection which is awkward.
// I will check imports. CommentsSection exported default only.
// I will use any[] to avoid import hell for now, or better:
// The parent passes it through.

export default function ArticleDetailView({ article, initialComments }: ArticleDetailViewProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    // Calculate reading time
    const readingTime = useMemo(() => {
        const text = (article.content || '').replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }, [article.content]);

    // Handle scroll for sticky header/share
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!article) return null;

    if (!article) return null;

    const { content: processedContent, toc } = useMemo(() => processContent(article.content), [article.content]);

    const imageUrl = article.featured_image_url?.startsWith('http')
        ? article.featured_image_url
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`;

    // Sanitize content
    const sanitizedContent = useMemo(() => {
        if (typeof window === 'undefined') return processedContent; // Server/Hydration mismatch avoidance if using simple dompurify
        // Actually isomorphic-dompurify works on server too.
        // But let's just use it directly in render.
        return processedContent;
    }, [processedContent]);

    // Using isomorphic-dompurify inside render or memo
    const safeContent = DOMPurify.sanitize(processedContent);

    return (
        <article className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* JSON-LD is handled in page.tsx generateMetadata/Head */}

            {/* Immersive Hero Header */}
            <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] w-full overflow-hidden">
                {/* Background Image with Parallax-ish feel */}
                <div className="absolute inset-0">
                    {article.featured_image_url ? (
                        <Image
                            src={imageUrl!}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                            quality={90}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black" />
                    )}
                    {/* Cinematic Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-12 z-10">
                    <div className="max-w-4xl">
                        {/* Breadcrumbs with Schema.org */}
                        <Breadcrumbs
                            items={[
                                { label: 'News', href: '/news' },
                                { label: article.category?.name || 'Article', href: `/news/${article.category?.slug || 'gaming'}` },
                                { label: article.title }
                            ]}
                            className="mb-6"
                        />

                        {/* Category Badge */}
                        <div className="mb-4 animate-fade-in-up">
                            <span className="px-4 py-1.5 text-xs font-bold tracking-wider bg-[var(--accent)] text-white rounded-full uppercase shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]">
                                {article.category?.name || "News"}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-xl animate-fade-in-up delay-100">
                            {article.title}
                        </h1>

                        {/* Author & Meta Data */}
                        <div className="flex flex-wrap items-center gap-6 text-white/90 animate-fade-in-up delay-200">
                            <Link href={`/profile/${article.author?.username}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] overflow-hidden group-hover:scale-105 transition-transform">
                                    {article.author?.avatar_url ? (
                                        <Image
                                            src={article.author.avatar_url}
                                            alt={article.author.username}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent)] font-bold">
                                            {article.author?.username?.charAt(0).toUpperCase() || "E"}
                                        </div>
                                    )}
                                </div>
                                <div className="group-hover:text-[var(--accent)] transition-colors">
                                    <p className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                                        {article.author?.display_name || article.author?.username || "TechPlay Editor"}
                                    </p>
                                    <p className="text-xs text-white/60">
                                        Author
                                    </p>
                                </div>
                            </Link>

                            <div className="hidden md:block w-px h-10 bg-white/20" />

                            <div className="flex flex-col">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                                    {(() => {
                                        try {
                                            const date = new Date(article.published_at || article.created_at);
                                            return isNaN(date.getTime()) ? 'Date unavailable' : format(date, 'dd/MM/yyyy');
                                        } catch (e) {
                                            return 'Date unavailable';
                                        }
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
                                <LiveViewCount slug={article.slug} initialViews={article.views || 0} />
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
                    <div className="hidden lg:block lg:col-span-1 h-full">
                        <div className={`sticky top-32 flex flex-col gap-4 items-center transition-all duration-300 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#1DA1F2] hover:border-[#1DA1F2] flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                                <Twitter className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#4267B2] hover:border-[#4267B2] flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#0077B5] hover:border-[#0077B5] flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                                <Linkedin className="w-5 h-5" />
                            </button>
                            <div className="w-px h-12 bg-[var(--border)] my-2" />
                            <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-all hover:scale-110 shadow-lg">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Article Body (Center) */}
                    <div className="lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden backdrop-blur-3xl bg-opacity-90">
                        {/* Decorative Background Blur */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

                        {/* Lead / Excerpt */}
                        {article.excerpt && (
                            <div className="mb-10 pl-6 border-l-4 border-[var(--accent)]">
                                <p className="text-xl md:text-2xl font-medium text-[var(--text-primary)] leading-relaxed italic">
                                    "{article.excerpt}"
                                </p>
                            </div>
                        )}

                        {/* Main Text */}
                        <div
                            className="prose prose-lg md:prose-xl max-w-none 
                                prose-headings:text-[var(--text-primary)] prose-headings:font-bold prose-headings:tracking-tight
                                prose-p:text-gray-200 prose-p:leading-relaxed prose-p:mb-6
                                prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline hover:prose-a:text-[var(--accent-hover)] transition-colors
                                prose-strong:text-[var(--text-primary)] prose-strong:font-bold
                                prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-[var(--border)] prose-img:my-8
                                prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[var(--text-primary)] prose-blockquote:font-medium prose-blockquote:bg-[var(--bg-elevated)]/30 prose-blockquote:py-4 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg
                                prose-code:bg-[var(--bg-elevated)] prose-code:text-[var(--accent)] prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
                                prose-ul:list-disc prose-ul:pl-6 prose-ul:text-[var(--text-secondary)]
                                prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-[var(--text-secondary)]
                                prose-hr:border-[var(--border)] prose-hr:my-10
                            "
                            dangerouslySetInnerHTML={{ __html: safeContent }}
                        />

                        {/* Mid-Article Ad (Visible only on mobile/tablet roughly) */}
                        <div className="my-12 lg:hidden">
                            <AdUnit position="article_mid" />
                        </div>

                        {/* Tags / Categories Footer */}
                        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-wrap gap-2">
                            <span className="text-sm font-semibold text-[var(--text-primary)] mr-2">Tags:</span>
                            {/* Just placeholders or category since tags aren't in Article type fully yet */}
                            <span className="px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm rounded-lg hover:text-[var(--accent)] hover:border-[var(--accent)] border border-transparent transition-all cursor-pointer">
                                {article.category?.name}
                            </span>
                            <span className="px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm rounded-lg hover:text-[var(--accent)] hover:border-[var(--accent)] border border-transparent transition-all cursor-pointer">
                                Technology
                            </span>
                            <span className="px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm rounded-lg hover:text-[var(--accent)] hover:border-[var(--accent)] border border-transparent transition-all cursor-pointer">
                                Gaming
                            </span>
                        </div>

                        {/* Author Bio Box */}
                        <div className="mt-12 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                            <Link href={`/profile/${article.author?.username}`} className="w-20 h-20 shrink-0 rounded-full border-2 border-[var(--accent)] p-1 hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-card)]">
                                    {article.author?.avatar_url ? (
                                        <Image
                                            src={article.author.avatar_url}
                                            alt={article.author.username}
                                            width={80}
                                            height={80}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[var(--text-primary)]">
                                            {article.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="flex-1">
                                <Link href={`/profile/${article.author?.username}`} className="inline-block group">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                                        About {article.author?.display_name || article.author?.username || "The Author"}
                                    </h3>
                                </Link>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                                    {article.author?.bio || "TechPlay editor and gaming enthusiast. Covering the latest in technology, esports, and hardware reviews."}
                                </p>
                                <Link
                                    href={`/profile/${article.author?.username}`}
                                    className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold text-sm hover:underline"
                                >
                                    View Full Profile <ArrowLeft className="w-4 h-4 rotate-180" />
                                </Link>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-12 pt-12 border-t border-[var(--border)]">
                            <CommentsSection
                                commentableId={article.id}
                                commentableType="article"
                                initialComments={initialComments}
                            />
                        </div>

                        {/* Related Articles Section */}
                        <RelatedArticles
                            articles={(article as any).related_articles || []}
                            title="Slični članci"
                        />
                    </div>

                    {/* Sidebar (Right) */}
                    <aside className="lg:col-span-3 space-y-8 mt-12 lg:mt-0">
                        <AdUnit position="sidebar_top" />

                        <div className="sticky top-24 space-y-8">
                            {toc.length > 0 && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-lg">
                                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-[var(--accent)] rounded-full" />
                                        On this page
                                    </h4>
                                    <TableOfContents items={toc} />
                                </div>
                            )}

                            {/* Trending - Static for now */}
                            <TrendingSidebar />

                            <AdUnit position="sidebar_bottom" />
                        </div>
                    </aside>
                </div>


            </div>
        </article>
    );
}

