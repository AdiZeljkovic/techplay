"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Facebook, Linkedin, Twitter, Share2, Calendar, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import Script from "next/script";
import { processContent } from "@/lib/content";
import TableOfContents from "@/components/ui/TableOfContents";
import AdUnit from "@/components/ads/AdUnit";
import CommentsSection from "@/components/comments/CommentsSection";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";

interface Guide {
    id: number;
    title: string;
    content: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    featured_image_url?: string;
    created_at: string;
    updated_at: string;
    author: {
        username: string;
        avatar_url?: string;
        name?: string;
        bio?: string;
    };
    helpful_count: number;
}

interface GuideDetailViewProps {
    guide: Guide;
    userVote?: boolean | null;
}

export default function GuideDetailView({ guide, userVote: initialVote }: GuideDetailViewProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const { user } = useAuth();
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

    // Handle scroll for sticky header/share
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleVote = async (isHelpful: boolean) => {
        if (!user) {
            alert("Please login to vote.");
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
            "name": guide.author?.username
        }
    };

    return (
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
                        <Link
                            href="/guides"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-[var(--accent)] transition-colors mb-6 backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full border border-white/10 w-fit"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Guides
                        </Link>

                        <div className="mb-4 animate-fade-in-up flex gap-3">
                            <span className={`px-4 py-1.5 text-xs font-bold tracking-wider rounded-full uppercase border backdrop-blur-md ${difficultyColors[guide.difficulty]}`}>
                                {guide.difficulty}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-xl animate-fade-in-up delay-100">
                            {guide.title}
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
                                        {guide.author?.username}
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    <div className="hidden lg:block lg:col-span-1 h-full">
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

                    <div className="lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden backdrop-blur-3xl bg-opacity-90">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

                        <div className="prose prose-lg md:prose-xl max-w-none 
                                prose-headings:text-[var(--text-primary)] prose-headings:font-bold prose-headings:tracking-tight
                                prose-p:text-[var(--text-secondary)] prose-p:leading-8 prose-p:mb-6
                                prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-[var(--text-primary)] prose-strong:font-bold
                                prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-[var(--border)] prose-img:my-8
                                prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[var(--text-primary)] prose-blockquote:bg-[var(--bg-elevated)]/30 prose-blockquote:py-4 prose-blockquote:rounded-r-lg
                                prose-code:bg-[var(--bg-elevated)] prose-code:text-[var(--accent)] prose-code:px-2 prose-code:rounded-md
                                prose-ul:list-disc prose-ul:pl-6 prose-ul:text-[var(--text-secondary)]
                                prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-[var(--text-secondary)]
                                prose-hr:border-[var(--border)] prose-hr:my-10
                            "
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />

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

                        <div className="my-12 lg:hidden">
                            <AdUnit position="article_mid" />
                        </div>
                    </div>

                    <aside className="lg:col-span-3 space-y-8 mt-12 lg:mt-0">
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

                <div className="mt-20 border-t border-[var(--border)] pt-12">
                    <CommentsSection commentableId={guide.id} commentableType="guide" />
                </div>
            </div>
        </article>
    );
}
