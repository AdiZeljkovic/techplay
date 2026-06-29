"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Images } from "lucide-react";
import GameScreenshotsLightbox from "./GameScreenshotsLightbox";
import GameTrailersPlayer from "./GameTrailersPlayer";

interface Screenshot { id: number; image: string; width: number; height: number }
interface Movie { id: number; name: string; preview: string; data: { "480": string; max: string } }

interface Props {
    movies: Movie[];
    screenshots: Screenshot[];
    gameName: string;
}

export default function GameMediaGallery({ movies, screenshots, gameName }: Props) {
    const [showTrailer, setShowTrailer] = useState(false);
    const [showScreenshots, setShowScreenshots] = useState(false);
    const [screenshotIndex, setScreenshotIndex] = useState(0);

    const hasTrailer = movies.length > 0;
    const hasScreenshots = screenshots.length > 0;

    const openScreenshot = (idx: number) => {
        setScreenshotIndex(idx);
        setShowScreenshots(true);
    };

    if (!hasTrailer && !hasScreenshots) return null;

    return (
        <>
            {/* Main gallery layout */}
            {hasTrailer && hasScreenshots ? (
                /* Trailer (left, ~60%) + Screenshots grid (right, ~40%) */
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
                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-tp-accent/90 backdrop-blur flex items-center justify-center shadow-lg shadow-tp-accent/40 group-hover:scale-110 transition-transform">
                                <Play className="w-7 h-7 text-white fill-white ml-1" />
                            </div>
                        </div>
                        {/* Label */}
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

                    {/* Screenshots 2×2 grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {screenshots.slice(0, 4).map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => openScreenshot(i)}
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
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                                        <Images className="w-5 h-5 text-white/80" />
                                        <span className="text-[11px] font-bold text-white/80">+{screenshots.length - 4} more</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ) : hasTrailer ? (
                /* Only trailer */
                <button
                    onClick={() => setShowTrailer(true)}
                    className="group relative w-full aspect-video rounded-xl overflow-hidden border border-white/[0.08] hover:border-tp-accent/50 transition-all focus:outline-none"
                    aria-label={`Play ${gameName} trailer`}
                >
                    <Image src={movies[0].preview} alt={`${gameName} — Trailer`} fill sizes="100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-tp-accent/90 flex items-center justify-center shadow-lg shadow-tp-accent/40 group-hover:scale-110 transition-transform">
                            <Play className="w-7 h-7 text-white fill-white ml-1" />
                        </div>
                    </div>
                </button>
            ) : (
                /* Only screenshots */
                <GameScreenshotsLightbox screenshots={screenshots} />
            )}

            {/* Trailers lightbox */}
            {showTrailer && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowTrailer(false)}
                >
                    <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                        <GameTrailersPlayer movies={movies} />
                    </div>
                    <button
                        onClick={() => setShowTrailer(false)}
                        className="absolute top-4 right-4 text-white/60 hover:text-white text-[11px] font-bold uppercase tracking-widest"
                    >
                        ✕ Close
                    </button>
                </div>
            )}

            {/* Screenshots lightbox */}
            {showScreenshots && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowScreenshots(false)}
                >
                    <div className="w-full max-w-5xl" onClick={e => e.stopPropagation()}>
                        <GameScreenshotsLightbox screenshots={screenshots} />
                    </div>
                    <button
                        onClick={() => setShowScreenshots(false)}
                        className="absolute top-4 right-4 text-white/60 hover:text-white text-[11px] font-bold uppercase tracking-widest"
                    >
                        ✕ Close
                    </button>
                </div>
            )}
        </>
    );
}
