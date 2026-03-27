"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Facebook, Linkedin, Twitter, Share2, Calendar, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import Script from "next/script";
import { processContent } from "@/lib/content";
import { useEmbedScripts } from "@/hooks/useEmbedScripts";
import TableOfContents from "@/components/ui/TableOfContents";
import AdUnit from "@/components/ads/AdUnit";
import CommentsSection from "@/components/comments/CommentsSection";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import DOMPurify from "isomorphic-dompurify";
import LiveViewCount from "@/components/tracking/LiveViewCount";
import ArticleFooterMessage from "@/components/ui/ArticleFooterMessage";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedArticles from "@/components/seo/RelatedArticles";
import { decodeHtml } from "@/lib/decode";
import { Dialog } from "@/components/ui/Dialog";

interface Guide {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    featured_image_url?: string;
    created_at: string;
    updated_at: string;
    author: {
        username: string;
        display_name?: string;
        avatar_url?: string;
        name?: string;
        bio?: string;
    };
    helpful_count: number;
    views?: number;
}

interface GuideDetailViewProps {
    guide: Guide;
    userVote?: boolean | null;
}

export default function GuideDetailView({ guide, userVote: initialVote }: GuideDetailViewProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const { user } = useAuth();
    useEmbedScripts();
    const [voteState, setVoteState] = useState<'helpful' | 'not_helpful' | null>(
        initialVote === true ? 'helpful' : initialVote === false ? 'not_helpful' : null
    );

    // Calculate reading time
    const readingTime = useMemo(() => {
        const text = guide.content.replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }, [guide.content]);

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

    const handleVote = async (isHelpful: boolean) => {
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        const newState = isHelpful ? 'helpful' : 'not_helpful';
        setVoteState(newState);

        try {
            await axios.post(`/guides/${guide.id}/vote`, { is_helpful: isHelpful });
        } catch (error) {
            console.error("Vote failed", error);
        }
    };

    const difficultyColors = {
        beginner: 'text-green-400 border-green-400 bg-green-400/10',
        intermediate: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
        advanced: 'text-red-400 border-red-400 bg-red-400/10',
    };

    const { content: processedContent, toc } = useMemo(() => processContent(guide.content), [guide.content]);

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

    return (
        <>
        <article className="min-h-screen bg-[var(--bg-primary)] pb-20">
            <Script
                id="guide-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Immersive Hero Header */}
            <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={guide.title}
                            fill
                            className="object-cover"
                            priority
                            quality={90}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-12 z-10">
                    <div className="max-w-4xl">
                        <Breadcrumbs
                            items={[
                                { label: 'Guides', href: '/guides' },
                                { label: decodeHtml(guide.title) },
                            ]}
                            className="mb-6"
                        />

                        <div className="mb-4 animate-fade-in-up flex gap-3">
                            <span className={`px-4 py-1.5 text-xs font-bold tracking-wider rounded-full uppercase border backdrop-blur-md ${difficultyColors[guide.difficulty]}`}>
                                {guide.difficulty}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-xl animate-fade-in-up delay-100">
                            {decodeHtml(guide.title)}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-white/90 animate-fade-in-up delay-200">
                            <Link href={`/profile/${guide.author?.username}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] overflow-hidden group-hover:scale-105 transition-transform">
                                    {guide.author?.avatar_url ? (
                                        <Image
                                            src={guide.author.avatar_url}
                                            alt={guide.author.username}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent)] font-bold">
                                            {guide.author?.username?.charAt(0).toUpperCase() || "E"}
                                        </div>
                                    )}
                                </div>
                                <div className="group-hover:text-[var(--accent)] transition-colors">
                                    <p className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                                        {guide.author?.display_name || guide.author?.username}
                                    </p>
                                </div>
                            </Link>

                            <div className="hidden md:block w-px h-10 bg-white/20" />

                            <div className="flex flex-col">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    {guide.helpful_count} Found Helpful
                                </span>
                            </div>

                            <div className="hidden md:block w-px h-10 bg-white/20" />

                            <div className="flex flex-col">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Clock className="w-4 h-4 text-[var(--accent)]" />
                                    {readingTime}
                                </span>
                            </div>

                            <div className="hidden md:block w-px h-10 bg-white/20" />

                            <div className="flex flex-col">
                                <LiveViewCount slug={guide.slug} initialViews={guide.views || 0} />
                                <span className="text-xs text-white/60">Views</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    <div className="hidden lg:block lg:col-span-1 h-full min-w-0">
                        <div className={`sticky top-32 flex flex-col gap-4 items-center transition-all duration-300 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#1DA1F2] hover:border-[#1DA1F2] flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                                <Twitter className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#4267B2] hover:border-[#4267B2] flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-all hover:scale-110 shadow-lg">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-8 min-w-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden backdrop-blur-3xl bg-opacity-90">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

                        {guide.excerpt && (
                            <blockquote className="border-l-4 border-[var(--accent)] pl-6 py-4 mb-8 bg-[var(--bg-elevated)]/30 rounded-r-lg">
                                <p className="text-lg italic text-[var(--text-primary)] leading-relaxed m-0">
                                    &ldquo;{guide.excerpt}&rdquo;
                                </p>
                            </blockquote>
                        )}

                        <div className="prose prose-lg md:prose-xl max-w-none
                                prose-headings:text-[var(--text-primary)] prose-headings:font-bold prose-headings:tracking-tight
                                prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:first:mt-0
                                prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-6 prose-h3:mb-2
                                prose-p:text-[var(--text-secondary)] prose-p:leading-8 prose-p:mb-4
                                prose-a:text-[var(--accent)] prose-a:underline prose-a:decoration-[var(--accent)]/40 prose-a:underline-offset-2 hover:prose-a:decoration-[var(--accent)] hover:prose-a:text-[var(--accent-hover)] prose-a:transition-all
                                prose-strong:text-white prose-strong:font-semibold
                                prose-em:text-[var(--text-secondary)] prose-em:italic prose-em:font-normal
                                prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-[var(--border)] prose-img:my-3
                                prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:pl-6 prose-blockquote:my-5 prose-blockquote:italic prose-blockquote:text-[var(--text-primary)] prose-blockquote:bg-[var(--bg-elevated)]/30 prose-blockquote:py-4 prose-blockquote:rounded-r-lg
                                prose-code:bg-[var(--bg-elevated)] prose-code:text-[var(--accent)] prose-code:px-2 prose-code:rounded-md
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

                        {/* Footer Message */}
                        <ArticleFooterMessage />

                        {/* Voting Section */}
                        <div className="mt-12 p-8 bg-[var(--bg-elevated)]/30 rounded-2xl border border-[var(--border)] text-center">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Was this guide helpful?</h3>
                            <p className="text-[var(--text-secondary)] mb-6 text-sm">Your feedback helps us improve our content.</p>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => handleVote(true)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-semibold ${voteState === 'helpful' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-green-500 hover:text-green-500'}`}
                                >
                                    <ThumbsUp className={`w-5 h-5 ${voteState === 'helpful' ? 'fill-current' : ''}`} />
                                    Yes, thanks!
                                </button>
                                <button
                                    onClick={() => handleVote(false)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-semibold ${voteState === 'not_helpful' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500 hover:text-red-500'}`}
                                >
                                    <ThumbsDown className={`w-5 h-5 ${voteState === 'not_helpful' ? 'fill-current' : ''}`} />
                                    Not really
                                </button>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-semibold text-[var(--text-primary)] mr-2">Tags:</span>
                            <span className={`px-3 py-1 text-sm rounded-lg border capitalize ${difficultyColors[guide.difficulty]}`}>
                                {guide.difficulty}
                            </span>
                        </div>

                        {/* About Author */}
                        <div className="mt-8 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                            <Link href={`/profile/${guide.author?.username}`} className="w-20 h-20 shrink-0 rounded-full border-2 border-[var(--accent)] p-1 hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-card)]">
                                    {guide.author?.avatar_url ? (
                                        <Image
                                            src={guide.author.avatar_url}
                                            alt={guide.author.username}
                                            width={80}
                                            height={80}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[var(--text-primary)]">
                                            {guide.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="flex-1">
                                <Link href={`/profile/${guide.author?.username}`} className="inline-block group">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                                        About {decodeHtml(guide.author?.display_name || guide.author?.username || "The Author")}
                                    </h3>
                                </Link>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                                    {decodeHtml(guide.author?.bio || "") || "TechPlay editor and gaming enthusiast. Covering the latest in technology, esports, and hardware reviews."}
                                </p>
                                <Link
                                    href={`/profile/${guide.author?.username}`}
                                    className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold text-sm hover:underline"
                                >
                                    View Full Profile <ArrowLeft className="w-4 h-4 rotate-180" />
                                </Link>
                            </div>
                        </div>

                        <div className="my-12 lg:hidden">
                            <AdUnit position="article_mid" />
                        </div>

                        {/* Related Guides */}
                        <RelatedArticles
                            articles={(guide as any).related_articles || []}
                            title="Slični vodiči"
                            viewAllHref="/guides"
                            articleBasePath="/guides"
                        />

                        {/* Comments */}
                        <div className="mt-12 border-t border-[var(--border)] pt-12">
                            <CommentsSection commentableId={guide.id} commentableType="guide" />
                        </div>
                    </div>

                    <aside className="lg:col-span-3 min-w-0 space-y-8 mt-12 lg:mt-0">
                        <AdUnit position="sidebar_top" />
                        <div className="sticky top-24 space-y-8">
                            {toc.length > 0 && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-lg">
                                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-[var(--accent)] rounded-full" />
                                        Guide Steps
                                    </h4>
                                    <TableOfContents items={toc} />
                                </div>
                            )}
                            <AdUnit position="sidebar_bottom" />
                        </div>
                    </aside>
                </div>
            </div>
        </article>

        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Login to vote</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-6">
                    Create a free account to rate guides and help the community find the best content.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                        Maybe later
                    </button>
                    <Link
                        href="/login"
                        className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors text-center"
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
