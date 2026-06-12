"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Rocket, Library, ArrowUpRight } from "lucide-react";
import { Article } from "@/types";
import { decodeHtml } from "@/lib/decode";

interface HeroCarouselProps {
    articles: Article[];
}

function getArticleLink(article: Article) {
    if (article.category?.type === "reviews") return `/reviews/${article.slug}`;
    if (article.category?.type === "tech" || article.category?.slug?.includes("hardware")) return `/hardware/${article.slug}`;
    return `/news/${article.slug}`;
}

export default function HeroCarousel({ articles }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const featuredArticles = articles.filter(a => a.featured_image_url).slice(0, 5);

    useEffect(() => {
        if (featuredArticles.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % featuredArticles.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [featuredArticles.length]);

    if (featuredArticles.length === 0) return null;

    const current = featuredArticles[currentIndex];
    const imageUrl = current.featured_image_url?.startsWith("http")
        ? current.featured_image_url
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${current.featured_image_url}`;

    const isReview = current.category?.type === "reviews";
    const categoryLabel = isReview ? "FEATURED REVIEW" : "FEATURED";
    const ctaLabel = isReview ? "READ REVIEW" : "READ ARTICLE";

    return (
        <section className="relative pt-10 pb-[80px] transition-colors duration-300">
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0">
                <div className="relative border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#05070A] rounded-xl overflow-hidden flex flex-col lg:flex-row lg:h-[560px] shadow-sm dark:shadow-none transition-colors duration-300">

                    {/* Main Background Image */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={imageUrl}
                            alt={decodeHtml(current.title)}
                            fill
                            priority
                            className="object-cover opacity-90 dark:opacity-100"
                        />
                        {/* Gradient overlays — light + dark (desktop) */}
                        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-white via-white/75 dark:from-[#05070A] dark:via-[#05070A]/70 to-transparent w-[55%]" />
                        <div className="hidden lg:block absolute inset-0 bg-gradient-to-l from-white via-white/60 dark:from-[#05070A] dark:via-[#05070A]/60 to-transparent w-[40%] right-0 left-auto" />
                        <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-white via-white/20 dark:from-[#05070A] dark:via-[#05070A]/10 to-transparent opacity-70 dark:opacity-60" />
                    </div>

                    {/* Left Content */}
                    <div className="relative z-10 w-full lg:w-[65%] p-6 sm:p-8 lg:p-[40px] xl:p-[60px] pt-[80px] lg:pt-[70px] flex flex-col justify-end min-h-[440px] lg:min-h-0 lg:h-full overflow-hidden">

                        {/* Mobile-only bottom gradient for text legibility */}
                        <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-white via-white/75 dark:from-[#05070A] dark:via-[#05070A]/75 to-transparent pointer-events-none" style={{ zIndex: -1 }} />

                        <span className="text-tp-accent font-bold tracking-[0.15em] text-[10px] uppercase mb-3 drop-shadow-sm">
                            {categoryLabel}
                        </span>

                        <h1 className="font-display text-[28px] sm:text-[36px] lg:text-[52px] xl:text-[62px] font-black text-zinc-900 dark:text-white uppercase leading-[0.95] lg:leading-[0.9] tracking-tight mb-2 drop-shadow-sm dark:drop-shadow-lg line-clamp-3">
                            {decodeHtml(current.title).toUpperCase()}
                        </h1>

                        {current.excerpt && (
                            <p className="text-[14px] text-zinc-700 dark:text-[#E4E4E5] max-w-[380px] leading-relaxed mb-6 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-md line-clamp-3">
                                {decodeHtml(current.excerpt)}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-7">
                            {current.author && (
                                <div className="flex items-center gap-4">
                                    <div className="w-[46px] h-[46px] rounded-full overflow-hidden border-2 border-zinc-200 dark:border-white/10 relative shadow-sm dark:shadow-lg">
                                        {current.author.avatar_url ? (
                                            <Image src={current.author.avatar_url} alt={current.author.display_name || current.author.username} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-200 dark:bg-[#1A1F26]" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-zinc-900 dark:text-white font-bold text-[14px] leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-none">
                                            {decodeHtml(current.author.display_name || current.author.username)}
                                        </span>
                                        <span suppressHydrationWarning className="text-zinc-600 dark:text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mt-1">
                                            {new Date(current.published_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="w-px h-10 bg-zinc-300 dark:bg-white/10 hidden sm:block mx-1" />

                            <Link
                                href={getArticleLink(current)}
                                className="bg-tp-accent hover:bg-tp-accent-hover text-white px-8 h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-tp-accent/20"
                            >
                                {ctaLabel}
                            </Link>
                        </div>

                        {/* Slide indicators */}
                        <div className="mt-6 lg:mt-0 flex gap-[8px] items-center lg:absolute lg:right-10 lg:bottom-[40px] xl:bottom-[60px]">
                            {featuredArticles.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`w-8 h-[3px] transition-all rounded-sm ${i === currentIndex ? "bg-tp-accent" : "bg-zinc-300 hover:bg-zinc-400 dark:bg-white/20 dark:hover:bg-white/40"}`}
                                    aria-label={`Slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Content Panels — floating glass cards */}
                    <div className="relative z-10 w-full lg:w-[380px] xl:w-[420px] lg:h-full lg:absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-3 p-4 lg:p-5
                        bg-zinc-50 dark:bg-[#070A0F] lg:bg-transparent dark:lg:bg-transparent
                        border-t border-zinc-200 dark:border-white/[0.06] lg:border-t-0">

                        {[
                            {
                                href: "/games/calendar",
                                icon: Rocket,
                                label: "UPCOMING RELEASE",
                                title: "Ghost of Yōtei",
                                meta: "02 OCT 2025",
                            },
                            {
                                href: "/forum",
                                icon: Flame,
                                label: "TRENDING DISCUSSION",
                                title: "Which game are you most excited for in 2025?",
                                meta: "128 REPLIES",
                            },
                            {
                                href: "/games",
                                icon: Library,
                                label: "GAMING DATABASE",
                                title: "Explore over 50,000 game titles",
                                meta: "UPDATED DAILY",
                            },
                        ].map((card) => (
                            <Link
                                key={card.href}
                                href={card.href}
                                className="group relative flex-1 flex items-center gap-4 rounded-2xl p-5 overflow-hidden
                                    bg-white/80 dark:bg-[#0B0E14]/75 backdrop-blur-md
                                    border border-zinc-200/90 dark:border-white/[0.08]
                                    shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]
                                    hover:border-tp-accent/40 dark:hover:border-tp-accent/40
                                    hover:bg-white/95 dark:hover:bg-[#0D1117]/90
                                    hover:shadow-[0_8px_32px_rgba(252,65,0,0.12)] dark:hover:shadow-[0_8px_40px_rgba(252,65,0,0.15)]
                                    hover:-translate-x-1 transition-all duration-300"
                            >
                                {/* Orange accent bar — slides in on hover */}
                                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-tp-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300" />

                                {/* Icon */}
                                <div className="w-[52px] h-[52px] rounded-xl shrink-0 flex items-center justify-center
                                    bg-tp-accent/10 border border-tp-accent/20
                                    group-hover:bg-tp-accent group-hover:border-tp-accent group-hover:shadow-[0_0_24px_rgba(252,65,0,0.35)]
                                    transition-all duration-300">
                                    <card.icon className="w-[22px] h-[22px] text-tp-accent group-hover:text-white transition-colors duration-300" strokeWidth={1.75} />
                                </div>

                                {/* Text */}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-zinc-500 dark:text-[#8B949E] text-[9px] font-bold uppercase tracking-[0.18em] mb-1">
                                        {card.label}
                                    </span>
                                    <h3 className="font-display text-[16px] xl:text-[17px] font-bold text-zinc-900 dark:text-white leading-snug mb-1 line-clamp-2 group-hover:text-tp-accent transition-colors duration-300">
                                        {card.title}
                                    </h3>
                                    <span className="text-tp-accent text-[10px] font-bold tracking-[0.14em] uppercase">
                                        {card.meta}
                                    </span>
                                </div>

                                {/* Arrow */}
                                <ArrowUpRight className="w-4 h-4 shrink-0 text-zinc-400 dark:text-white/25 group-hover:text-tp-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                            </Link>
                        ))}

                    </div>
                </div>
            </div>
        </section>
    );
}
