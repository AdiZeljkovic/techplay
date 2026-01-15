import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TrendingUp, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { Article } from "@/types";

interface HeroCarouselProps {
    articles: Article[];
}

export default function HeroCarousel({ articles }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter valid articles with images
    const featuredArticles = articles.filter(a => a.featured_image_url).slice(0, 5);

    // Auto-advance
    useEffect(() => {
        if (featuredArticles.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [featuredArticles.length]);

    if (featuredArticles.length === 0) return null; // Or skeleton

    const currentArticle = featuredArticles[currentIndex];

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length);

    return (
        <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-[#001540]">

            {/* Background Image Layer with Crossfade */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} // Smooth crossfade
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 z-0"
                >
                    <Image
                        src={currentArticle.featured_image_url.startsWith('http')
                            ? currentArticle.featured_image_url
                            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${currentArticle.featured_image_url}`}
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlay for Readability - Using Brand Blue */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#00215E] via-[#00215E]/60 to-transparent opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00215E]/90 via-transparent to-transparent" />
                </motion.div>
            </AnimatePresence>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-20 md:pb-32">

                {/* TRENDING NOW Ticker Effect */}
                <div className="mb-4 md:mb-6 flex items-center gap-3 overflow-hidden">
                    <div className="bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest whitespace-nowrap animate-pulse">
                        Trending Now
                    </div>
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={`ticker-${currentIndex}`}
                        className="text-white/80 text-xs font-mono uppercase tracking-wide flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                        {currentArticle.category.name}
                        <span className="text-white/40">|</span>
                        {/* Date formatter or TimeAgo logic needed, using static for now or pass property */}
                        {new Date(currentArticle.published_at).toLocaleDateString()}
                    </motion.div>
                </div>

                {/* Main Text Content */}
                <div className="max-w-3xl">
                    <motion.h1
                        key={`title-${currentIndex}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-4 md:mb-6 tracking-tight drop-shadow-lg line-clamp-3 md:line-clamp-none"
                    >
                        {currentArticle.title}
                    </motion.h1>

                    {/* <motion.p
                        key={`desc-${currentIndex}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-200 text-sm md:text-xl line-clamp-2 md:line-clamp-none mb-6 md:mb-8 max-w-2xl font-medium"
                        dangerouslySetInnerHTML={{ __html: currentArticle.excerpt }}
                    /> */}

                    <motion.div
                        key={`btn-${currentIndex}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-wrap items-center gap-4"
                    >
                        <Link
                            href={`/news/${currentArticle.slug}`} // Assuming News route structure
                            className="px-8 py-3.5 bg-[var(--accent)] text-white font-bold rounded-full hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2 shadow-lg hover:shadow-[var(--accent)]/40 hover:-translate-y-1"
                        >
                            Read Full Story <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2 text-white/80 text-sm font-semibold pl-4">
                            <Clock className="w-4 h-4 text-[var(--accent)]" /> 5 min read
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Controls */}
                <div className="absolute right-4 bottom-10 md:bottom-20 md:right-10 flex items-center gap-2 md:gap-4 z-20">
                    <button
                        onClick={prevSlide}
                        className="p-3 md:p-4 rounded-full border border-white/10 bg-black/20 text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all backdrop-blur-md"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="p-3 md:p-4 rounded-full border border-white/10 bg-black/20 text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all backdrop-blur-md"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Pagination Indicators */}
                <div className="absolute bottom-10 left-4 md:left-auto md:right-1/2 md:translate-x-1/2 flex gap-2">
                    {featuredArticles.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-8 bg-[var(--accent)]" : "w-2 bg-white/30 hover:bg-white/60"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
