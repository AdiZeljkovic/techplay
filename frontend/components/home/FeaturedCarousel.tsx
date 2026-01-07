"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Article, PaginatedResponse } from "@/types";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function FeaturedCarousel() {
    const [current, setCurrent] = useState(0);

    const { data, isLoading } = useSWR<PaginatedResponse<Article>>(
        '/news?is_featured=1&per_page=5',
        fetcher
    );

    const slides = data?.data || [];

    // Auto-rotate
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const next = () => setCurrent((c) => (c + 1) % slides.length);
    const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

    if (isLoading) {
        return (
            <section className="container mx-auto px-4 py-8 -mt-20 relative z-20">
                <div className="h-[500px] w-full rounded-2xl glass-panel animate-pulse bg-white/5" />
            </section>
        );
    }

    if (slides.length === 0) {
        // Fallback if no API data yet (Development mode)
        return (
            <section className="container mx-auto px-4 py-8 -mt-20 relative z-20">
                <div className="h-[500px] w-full rounded-2xl glass-panel flex items-center justify-center border-white/10">
                    <p className="text-gray-400">No featured stories found. Publish some articles in the Admin Panel.</p>
                </div>
            </section>
        );
    }

    const currentSlide = slides[current];

    return (
        <section className="container mx-auto px-4 py-8 -mt-20 relative z-20">
            <div className="relative h-[500px] w-full rounded-2xl overflow-hidden glass-panel border-white/10 group">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide.id}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        {currentSlide.featured_image_url ? (
                            <Image
                                src={currentSlide.featured_image_url.startsWith('http')
                                    ? currentSlide.featured_image_url
                                    : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${currentSlide.featured_image_url}`}
                                alt={currentSlide.title}
                                fill
                                className="object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                                priority
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-60" />
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c15] via-transparent to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex gap-2 mb-4">
                                    <span className="inline-block px-3 py-1 bg-neon-teal/20 text-neon-teal rounded-full text-sm font-bold border border-neon-teal/30 capitalize">
                                        {currentSlide.category.name}
                                    </span>
                                    {currentSlide.status === 'published' && (
                                        <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold border border-green-500/30">
                                            New
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-3xl md:text-5xl font-bold font-display mb-4 leading-tight">
                                    {currentSlide.title}
                                </h2>

                                <div className="flex items-center gap-6 text-gray-300 mb-6">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4" />
                                        {formatDistanceToNow(new Date(currentSlide.published_at), { addSuffix: true })}
                                    </span>
                                    <span className="text-sm text-neon-purple">
                                        By {currentSlide.author?.username || 'TechPlay'}
                                    </span>
                                </div>

                                <Link href={`/news/${currentSlide.slug}`}>
                                    <Button variant="primary">Read Story</Button>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="absolute bottom-8 right-8 flex gap-2">
                    <button onClick={prev} className="p-3 rounded-full bg-white/10 hover:bg-neon-teal hover:text-black transition-all backdrop-blur-md">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={next} className="p-3 rounded-full bg-white/10 hover:bg-neon-teal hover:text-black transition-all backdrop-blur-md">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-8 right-1/2 translate-x-1/2 flex gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === current ? 'w-8 bg-neon-teal' : 'w-2 bg-white/30'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
