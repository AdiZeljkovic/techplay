"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import GameTrailersPlayer from "./GameTrailersPlayer";

interface Screenshot { id: number; image: string; width: number; height: number }
interface Movie { id: number; name: string; preview: string; data: { "480": string; max: string } }

interface Props {
    movies: Movie[];
    screenshots: Screenshot[];
    gameName: string;
}

/** Inline fullscreen lightbox for screenshots — no nested fixed overlays */
function ScreenshotLightbox({
    screenshots,
    initial,
    onClose,
}: {
    screenshots: Screenshot[];
    initial: number;
    onClose: () => void;
}) {
    const [idx, setIdx] = useState(initial);
    const total = screenshots.length;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") setIdx(i => (i - 1 + total) % total);
            if (e.key === "ArrowRight") setIdx(i => (i + 1) % total);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, total]);

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/96 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Prev */}
            {total > 1 && (
                <button
                    onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + total) % total); }}
                    className="absolute left-3 sm:left-5 p-2.5 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}

            {/* Image */}
            <div
                className="relative w-full max-w-5xl px-14 sm:px-20"
                onClick={e => e.stopPropagation()}
            >
                <Image
                    src={screenshots[idx].image}
                    alt={`Screenshot ${idx + 1}`}
                    width={1920}
                    height={1080}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
                    priority
                />
                <p className="text-center text-white/40 text-[11px] font-semibold mt-3 tabular-nums">
                    {idx + 1} / {total}
                </p>
            </div>

            {/* Next */}
            {total > 1 && (
                <button
                    onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % total); }}
                    className="absolute right-3 sm:right-5 p-2.5 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}

export default function GameMediaGallery({ movies, screenshots, gameName }: Props) {
    const [showTrailer, setShowTrailer] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    const hasTrailer = movies.length > 0;
    const hasScreenshots = screenshots.length > 0;

    if (!hasTrailer && !hasScreenshots) return null;

    return (
        <>
            {/* ── CASE 1: Trailer + Screenshots ─────────────────────────────── */}
            {hasTrailer && hasScreenshots ? (
                <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3">
                    {/* Featured Trailer */}
                    <button
                        onClick={() => setShowTrailer(true)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] hover:border-tp-accent/50 transition-all focus:outline-none"
                        aria-label={`Play ${gameName} trailer`}
                    >
                        <Image
                            src={movies[0].preview}
                            alt={`${gameName} — Official Trailer`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 60vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-tp-accent/90 backdrop-blur flex items-center justify-center shadow-lg shadow-tp-accent/40 group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 text-white fill-white ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-3 left-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                                Official Trailer
                            </span>
                        </div>
                        {movies.length > 1 && (
                            <div className="absolute top-3 right-3">
                                <span className="text-[10px] font-bold text-white/60 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                                    +{movies.length - 1} more
                                </span>
                            </div>
                        )}
                    </button>

                    {/* 2×2 Screenshots grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {screenshots.slice(0, 4).map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => setLightboxIdx(i)}
                                className="group relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] hover:border-tp-accent/50 transition-all focus:outline-none"
                                aria-label={`Screenshot ${i + 1}`}
                            >
                                <Image
                                    src={s.image}
                                    alt={`${gameName} screenshot ${i + 1}`}
                                    fill
                                    sizes="(max-width: 1024px) 50vw, 20vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                {i === 3 && screenshots.length > 4 && (
                                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-1">
                                        <Images className="w-5 h-5 text-white/80" />
                                        <span className="text-[11px] font-bold text-white/80">
                                            +{screenshots.length - 4} more
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

            ) : hasTrailer ? (
                /* ── CASE 2: Trailer only ──────────────────────────────────── */
                <button
                    onClick={() => setShowTrailer(true)}
                    className="group relative w-full aspect-video rounded-xl overflow-hidden border border-white/[0.08] hover:border-tp-accent/50 transition-all focus:outline-none"
                    aria-label={`Play ${gameName} trailer`}
                >
                    <Image
                        src={movies[0].preview}
                        alt={`${gameName} — Trailer`}
                        fill
                        sizes="100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-tp-accent/90 flex items-center justify-center shadow-lg shadow-tp-accent/40 group-hover:scale-110 transition-transform">
                            <Play className="w-7 h-7 text-white fill-white ml-1" />
                        </div>
                    </div>
                </button>

            ) : (
                /* ── CASE 3: Screenshots only — proper grid layout ─────────── */
                <div className="space-y-3">
                    {/* Featured first screenshot */}
                    <button
                        onClick={() => setLightboxIdx(0)}
                        className="group relative w-full aspect-video rounded-xl overflow-hidden border border-white/[0.08] hover:border-tp-accent/50 transition-all focus:outline-none"
                        aria-label={`${gameName} — screenshot 1`}
                    >
                        <Image
                            src={screenshots[0].image}
                            alt={`${gameName} screenshot 1`}
                            fill
                            sizes="100vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute top-3 right-3">
                            <span className="text-[10px] font-bold text-white/70 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                                {screenshots.length} screenshots
                            </span>
                        </div>
                        {/* Expand hint */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-bold text-white/60 bg-black/60 backdrop-blur px-2 py-1 rounded-md uppercase tracking-widest">
                                Click to expand
                            </span>
                        </div>
                    </button>

                    {/* Thumbnail strip */}
                    {screenshots.length > 1 && (
                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                            {screenshots.slice(1).map((s, i) => (
                                <button
                                    key={s.id}
                                    onClick={() => setLightboxIdx(i + 1)}
                                    className="group relative shrink-0 w-[140px] h-[80px] sm:w-[160px] sm:h-[90px] rounded-lg overflow-hidden border border-white/[0.08] hover:border-tp-accent/50 transition-all focus:outline-none"
                                    aria-label={`Screenshot ${i + 2}`}
                                >
                                    <Image
                                        src={s.image}
                                        alt={`${gameName} screenshot ${i + 2}`}
                                        fill
                                        sizes="160px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/0 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Trailer modal ──────────────────────────────────────────────── */}
            {showTrailer && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowTrailer(false)}
                >
                    <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                        <GameTrailersPlayer movies={movies} />
                    </div>
                    <button
                        onClick={() => setShowTrailer(false)}
                        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* ── Screenshot lightbox ────────────────────────────────────────── */}
            {lightboxIdx !== null && (
                <ScreenshotLightbox
                    screenshots={screenshots}
                    initial={lightboxIdx}
                    onClose={() => setLightboxIdx(null)}
                />
            )}
        </>
    );
}
