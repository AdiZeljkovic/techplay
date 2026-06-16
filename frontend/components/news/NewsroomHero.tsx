"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, Star, RefreshCw, Globe, Gamepad2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Article } from "@/types";
import { decodeHtml } from "@/lib/decode";

interface CategoryItem {
    id: string;
    label: string;
    icon: LucideIcon;
    slug?: string;
}

interface NewsroomHeroProps {
    sectionLabel?: string;
    headline: string;
    headlineAccent?: string;
    tagline?: string;
    description?: string;
    stats?: { icon: LucideIcon; label: string }[];
    categories?: CategoryItem[];
    selectedCategory?: string;
    basePath?: string;
    categoryBase?: string;
    featuredArticle?: Article;
}

const DEFAULT_STATS = [
    { icon: RefreshCw, label: "Updated Daily" },
    { icon: Globe,     label: "Global Gaming Coverage" },
    { icon: Gamepad2,  label: "Built for Players" },
];

export default function NewsroomHero({
    sectionLabel = "TECHPLAY.GG NEWSROOM",
    headline,
    headlineAccent,
    tagline,
    description,
    stats = DEFAULT_STATS,
    categories,
    selectedCategory,
    basePath,
    categoryBase,
    featuredArticle,
}: NewsroomHeroProps) {
    const featuredImageUrl = featuredArticle?.featured_image_url
        ? (featuredArticle.featured_image_url.startsWith('http')
            ? featuredArticle.featured_image_url
            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${featuredArticle.featured_image_url}`)
        : null;

    const featuredHref = featuredArticle ? `/news/${featuredArticle.slug}` : '#';

    const publishedDate = (() => {
        if (!featuredArticle?.published_at) return '';
        try {
            const d = new Date(featuredArticle.published_at);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return ''; }
    })();

    return (
        <div className="relative w-full overflow-hidden bg-[#05070A] border-b border-[#161B22] mb-10">

            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-[80px] -left-[80px] w-[500px] h-[400px] bg-tp-accent/[0.07] blur-[130px] rounded-full" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-tp-accent/50 via-tp-accent/20 to-transparent" />
            </div>

            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-tp-accent/40" />
            <div className="absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-tp-accent/40" />

            <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 pt-10 pb-0">
                <div className="flex flex-col xl:flex-row gap-8 xl:gap-14 items-start">

                    {/* LEFT: Text + tabs */}
                    <motion.div
                        className="flex-1 min-w-0 flex flex-col"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Top label row */}
                        <div className="flex items-center justify-between mb-5">
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3F3F46]">
                                <span className="w-1.5 h-1.5 rounded-full bg-tp-accent/50" />
                                {sectionLabel}
                            </span>
                            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3F3F46]">
                                LIVE FEED
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            </span>
                        </div>

                        {/* Big headline */}
                        <h1 className="font-display font-black leading-[0.88] tracking-tight mb-5">
                            <span className="text-[clamp(52px,9vw,108px)] text-white">{headline}</span>
                            {headlineAccent && (
                                <span className="text-[clamp(52px,9vw,108px)] text-tp-accent">{headlineAccent}</span>
                            )}
                        </h1>

                        {/* Tagline */}
                        {tagline && (
                            <p className="text-[16px] md:text-[19px] font-semibold text-white leading-snug mb-3">
                                {tagline}
                            </p>
                        )}

                        {/* Description */}
                        {description && (
                            <p className="text-[13px] text-[#6B7280] leading-relaxed mb-7 max-w-lg">
                                {description}
                            </p>
                        )}

                        {/* Stats row */}
                        {stats.length > 0 && (
                            <div className="flex items-center flex-wrap gap-y-2 mb-8">
                                {stats.map((stat, i) => (
                                    <span key={i} className="flex items-center">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#3F3F46]">
                                            <stat.icon className="w-3 h-3 text-tp-accent/50" />
                                            {stat.label}
                                        </span>
                                        {i < stats.length - 1 && (
                                            <span className="mx-4 text-[#1E2430] select-none">|</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Category tabs — bottom border underline style */}
                        {categories && categories.length > 0 && (
                            <div className="flex items-end gap-0 overflow-x-auto scrollbar-hide border-b border-[#161B22] -mx-4 px-4 xl:mx-0 xl:px-0">
                                {categories.map((cat) => {
                                    const isSelected = selectedCategory === cat.id;
                                    const href = cat.slug === 'all'
                                        ? (basePath || '#')
                                        : `${categoryBase || basePath}/${cat.slug}`;
                                    return (
                                        <Link
                                            key={cat.id}
                                            href={href}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 md:px-4 py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 border-b-2 -mb-px transition-all",
                                                isSelected
                                                    ? "text-white border-tp-accent"
                                                    : "text-[#4B5563] border-transparent hover:text-[#A1A1AA] hover:border-white/20"
                                            )}
                                        >
                                            <cat.icon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-tp-accent" : "text-[#4B5563]")} />
                                            <span className="hidden xs:inline sm:inline">{cat.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* RIGHT: Featured article card */}
                    {featuredArticle && featuredImageUrl && (
                        <motion.div
                            className="w-full xl:w-[400px] shrink-0 pb-0 xl:pb-0 xl:pt-2"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Link
                                href={featuredHref}
                                className="group block bg-[#0B0E14] border border-[#161B22] rounded-[16px] overflow-hidden hover:border-tp-accent/30 transition-colors"
                            >
                                {/* Image */}
                                <div className="relative w-full aspect-[16/9] overflow-hidden">
                                    <Image
                                        src={featuredImageUrl}
                                        alt={decodeHtml(featuredArticle.title)}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 1280px) 100vw, 400px"
                                        unoptimized={featuredImageUrl.includes('discord') || featuredImageUrl.includes('gravatar')}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/70 via-transparent to-transparent" />

                                    {/* Editor's Pick badge */}
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0B0E14]/90 backdrop-blur-sm border border-[#161B22] rounded-full px-3 py-1">
                                        <Star className="w-3 h-3 text-tp-accent fill-tp-accent" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Editor's Pick</span>
                                    </div>

                                    {/* Category badge */}
                                    {featuredArticle.category?.name && (
                                        <div className="absolute top-3 right-3 bg-tp-accent text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                                            {featuredArticle.category.name}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    {publishedDate && (
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563] mb-2">
                                            {publishedDate}
                                        </p>
                                    )}

                                    <h3 className="font-display font-bold text-[16px] text-white leading-tight mb-2 group-hover:text-tp-accent transition-colors line-clamp-3">
                                        {decodeHtml(featuredArticle.title)}
                                    </h3>

                                    {featuredArticle.excerpt && (
                                        <p className="text-[12px] text-[#6B7280] leading-relaxed line-clamp-2 mb-4">
                                            {decodeHtml(featuredArticle.excerpt)}
                                        </p>
                                    )}

                                    <span className="inline-flex items-center gap-1.5 text-tp-accent text-[11px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all duration-200">
                                        READ MORE <span>→</span>
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
