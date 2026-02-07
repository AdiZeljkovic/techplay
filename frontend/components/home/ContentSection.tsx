"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, User, Clock, Layers } from "lucide-react";
import { Article } from "@/types";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/imageUrl";
import { Skeleton } from "@/components/ui/Skeleton";
import { decodeHtml } from "@/lib/decode";

interface ContentSectionProps {
    title: string;
    icon: any;
    articles: Article[];
    viewAllLink: string;
    color?: string;
    isLoading?: boolean;
}

// Helper function to get score color
function getScoreColor(score: number): { bg: string; text: string } {
    if (score >= 9) return { bg: 'bg-green-500', text: 'text-green-500' };
    if (score >= 7) return { bg: 'bg-yellow-500', text: 'text-yellow-500' };
    if (score >= 5) return { bg: 'bg-orange-500', text: 'text-orange-500' };
    return { bg: 'bg-red-500', text: 'text-red-500' };
}

// Skeleton component for loading state - matches exact layout dimensions to prevent CLS
function ContentSectionSkeleton({ title, icon: Icon, viewAllLink }: { title: string; icon: any; viewAllLink: string }) {
    return (
        <div className="mb-12">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 border-l-4 border-[var(--accent)] pl-4">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                    <Icon className="w-6 h-6 text-[var(--accent)]" />
                    {title}
                </h2>
                <Link
                    href={viewAllLink}
                    className="group flex items-center gap-2 text-xs font-bold text-white/60 hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
                >
                    View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Featured Skeleton (Left) - matches h-[280px] sm:h-[320px] md:h-[400px] */}
                <div className="h-[280px] sm:h-[320px] md:h-[400px] rounded-2xl overflow-hidden border border-white/10">
                    <Skeleton className="h-full w-full rounded-none" />
                </div>

                {/* Grid of 4 Smaller Skeletons (Right) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col gap-3 p-4 bg-[#00215E] border border-white/5 rounded-2xl">
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <div className="flex-1 flex flex-col gap-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="mt-auto flex items-center justify-between">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ContentSection({ title, icon: Icon, articles, viewAllLink, color = "var(--accent)", isLoading = false }: ContentSectionProps) {
    // CLS FIX: Show skeleton with same dimensions instead of returning null
    if (isLoading || !articles || articles.length === 0) {
        return <ContentSectionSkeleton title={title} icon={Icon} viewAllLink={viewAllLink} />;
    }

    // Determine the correct link prefix based on section type
    let linkPrefix = '/news';
    if (viewAllLink.includes('/reviews')) linkPrefix = '/reviews';
    else if (viewAllLink.includes('/hardware')) linkPrefix = '/hardware';

    const isReviews = linkPrefix === '/reviews';

    // Split into featured (first item) and grid (next 4 items)
    const featured = articles[0];
    const gridItems = articles.slice(1, 5);

    // Get image URLs with appropriate variants
    const featuredImageUrl = featured.featured_image_url
        ? getImageUrl(
            featured.featured_image_url.startsWith('http')
                ? featured.featured_image_url
                : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${featured.featured_image_url}`,
            'large' // Featured uses large variant
        )
        : null;

    return (
        <div className="mb-12">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 border-l-4 border-[var(--accent)] pl-4">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                    <Icon className="w-6 h-6 text-[var(--accent)]" />
                    {title}
                </h2>
                <Link
                    href={viewAllLink}
                    className="group flex items-center gap-2 text-xs font-bold text-white/60 hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
                >
                    View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Featured Article (Left) */}
                <Link href={`${linkPrefix}/${featured.slug}`} className="group relative h-[280px] sm:h-[320px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg border border-white/10">
                    {/* Image */}
                    <div className="absolute inset-0">
                        {featuredImageUrl ? (
                            <Image
                                src={featuredImageUrl}
                                alt={featured.title}
                                fill
                                quality={65}
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#001540]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#000B25] via-[#000B25]/60 to-transparent" />
                    </div>

                    {/* Review Score Badge (top-right corner) */}
                    {isReviews && featured.review_score !== undefined && featured.review_score !== null && (
                        <div className={`absolute top-4 right-4 w-14 h-14 rounded-full ${getScoreColor(featured.review_score).bg} flex items-center justify-center shadow-lg`}>
                            <span className="text-white text-xl font-bold">{featured.review_score}</span>
                        </div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <span className="inline-block px-3 py-1 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider rounded mb-3 shadow-[0_4px_10px_rgba(252,65,0,0.4)]">
                            {decodeHtml(featured.category.name)}
                        </span>
                        <h3 className="text-2xl font-bold text-white leading-tight mb-3 group-hover:text-[var(--accent-hover)] transition-colors">
                            {decodeHtml(featured.title)}
                        </h3>
                        <p className="text-white/70 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">
                            {decodeHtml(featured.excerpt)}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-white/70 font-bold uppercase tracking-wide">
                            <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                                {featured.author?.display_name || featured.author?.username || "Editor"}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                                {featured.published_at ? format(new Date(featured.published_at), 'dd/MM/yyyy') : 'Recently'}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Grid of 4 Smaller Articles (Right) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {gridItems.map((item) => {
                        // PERF: Use 'thumb' variant (256px) for small grid items (displayed at ~228x128)
                        const itemImageUrl = item.featured_image_url
                            ? getImageUrl(
                                item.featured_image_url.startsWith('http')
                                    ? item.featured_image_url
                                    : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${item.featured_image_url}`,
                                'thumb'
                            )
                            : null;

                        return (
                            <Link key={item.id} href={`${linkPrefix}/${item.slug}`} className="group flex flex-col gap-3 p-4 bg-[#00215E] border border-white/5 rounded-2xl hover:bg-white/5 transition-all hover:border-white/10 hover:-translate-y-1 shadow-md">
                                <div className="relative h-32 rounded-xl overflow-hidden">
                                    {itemImageUrl ? (
                                        <Image
                                            src={itemImageUrl}
                                            alt={item.title}
                                            fill
                                            quality={65}
                                            sizes="(max-width: 640px) 100vw, 256px"
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[#0a0f1c]" />
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                                        {decodeHtml(item.category.name)}
                                    </div>

                                    {/* Review Score Badge for grid items */}
                                    {isReviews && item.review_score !== undefined && item.review_score !== null && (
                                        <div className={`absolute top-2 right-2 w-9 h-9 rounded-full ${getScoreColor(item.review_score).bg} flex items-center justify-center shadow-md`}>
                                            <span className="text-white text-sm font-bold">{item.review_score}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-[var(--accent)] transition-colors">
                                        {decodeHtml(item.title)}
                                    </h4>
                                    <div className="mt-auto flex items-center justify-between text-[10px] text-white/60 uppercase font-bold tracking-wide">
                                        <span className="truncate max-w-[100px]">{item.author?.display_name || item.author?.username || "TechPlay"}</span>
                                        <span>{item.published_at ? format(new Date(item.published_at), 'dd/MM/yyyy') : ''}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
