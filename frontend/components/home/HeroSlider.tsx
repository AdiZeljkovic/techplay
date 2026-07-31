"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Article } from "@/types";
import { articleHref } from "@/lib/articleHref";

const SLIDE_MS = 6000;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Featured-article slider for the homepage hero: crossfade + Ken Burns,
 * autoplay with hover/focus pause, arrows, swipe, and progress-pill dots.
 */
export default function HeroSlider({ articles }: { articles: Article[] }) {
    const slides = articles.filter((a) => a.featured_image_url).slice(0, 5);
    const reduceMotion = useReducedMotion();

    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const count = slides.length;
    const go = useCallback((next: number) => {
        if (count === 0) return;
        setIndex(((next % count) + count) % count);
    }, [count]);

    useEffect(() => {
        if (paused || reduceMotion || count < 2) return;
        const t = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
        return () => clearInterval(t);
    }, [paused, reduceMotion, count]);

    if (count === 0) {
        return <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/15 via-transparent to-transparent" />;
    }

    const current = slides[index];

    const onTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        // horizontal-dominant swipes only, so vertical page scroll still works
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
        touchStart.current = null;
    };

    return (
        <div
            className="absolute inset-0 group/slider overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-roledescription="carousel"
        >
            <AnimatePresence initial={false}>
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="absolute inset-0"
                >
                    {/* Ken Burns drift */}
                    <motion.div
                        initial={reduceMotion ? undefined : { scale: 1.02 }}
                        animate={reduceMotion ? undefined : { scale: 1.12 }}
                        transition={{ duration: SLIDE_MS / 1000 + 2, ease: "linear" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={current.featured_image_url!}
                            alt={current.title}
                            fill
                            priority={index === 0}
                            sizes="(max-width: 1024px) 100vw, 45vw"
                            className="object-cover"
                        />
                    </motion.div>

                    {/* Readability scrims: bottom for the caption, left to blend into the card */}
                    {/* bottom scrim only — the diagonal seam replaces the old side blend */}
                    <div className="absolute inset-0 scrim-card" />
                </motion.div>
            </AnimatePresence>

            {/* Caption */}
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.45, ease: EASE }}
                    >
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest">
                                Featured
                            </span>
                            {current.category?.name && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-mid)]">
                                    {current.category.name}
                                </span>
                            )}
                        </div>

                        <Link href={articleHref(current)} className="group/title block">
                            <h2 className="font-display text-[20px] md:text-[26px] xl:text-[28px] font-black text-white leading-[1.15] line-clamp-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] group-hover/title:text-[var(--accent)] transition-colors">
                                {current.title}
                            </h2>
                        </Link>

                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[var(--ink-low)]">
                            {current.author?.display_name || current.author?.name ? (
                                <span className="font-semibold text-[var(--ink-mid)]">
                                    {current.author.display_name || current.author.name}
                                </span>
                            ) : null}
                            {current.published_at_human && <span>{current.published_at_human}</span>}
                            {current.reading_time && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {current.reading_time}
                                </span>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                {count > 1 && (
                    <div className="mt-4 flex items-center gap-1.5">
                        {slides.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => go(i)}
                                aria-label={`Show featured story ${i + 1}`}
                                aria-current={i === index}
                                className={`h-1.5 rounded-full overflow-hidden transition-all ${
                                    i === index ? "w-9 bg-white/25" : "w-1.5 bg-white/25 hover:bg-white/50"
                                }`}
                            >
                                {i === index && (
                                    <motion.span
                                        key={`fill-${index}-${paused}`}
                                        className="block h-full bg-[var(--accent)]"
                                        initial={{ width: reduceMotion || paused ? "100%" : "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: reduceMotion || paused ? 0 : SLIDE_MS / 1000, ease: "linear" }}
                                    />
                                )}
                            </button>
                        ))}
                        <span className="ml-auto text-[10px] font-bold tabular-nums text-[var(--ink-low)]">
                            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                        </span>
                    </div>
                )}
            </div>

            {/* Arrows — revealed on hover (always visible on touch) */}
            {count > 1 && (
                <>
                    <button
                        onClick={() => go(index - 1)}
                        aria-label="Previous story"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-white/80 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 focus-visible:opacity-100 hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => go(index + 1)}
                        aria-label="Next story"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-white/80 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 focus-visible:opacity-100 hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </>
            )}
        </div>
    );
}
