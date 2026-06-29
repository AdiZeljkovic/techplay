"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Film } from "lucide-react";

interface Movie {
    id: number;
    name: string;
    preview: string;
    data: { "480": string; max: string };
}

interface Props {
    youtubeId: string | null;
    movie: Movie | null;
    gameName: string;
    backgroundImage?: string | null;
}

export default function HeroTrailerPanel({ youtubeId, movie, gameName, backgroundImage }: Props) {
    const [playing, setPlaying] = useState(false);

    // 1. YouTube embed
    if (youtubeId) {
        return (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                    title={`${gameName} — Official Trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                        Official Reveal Trailer · Watch on YouTube
                    </p>
                </div>
            </div>
        );
    }

    // 2. RAWG movie — only if movie exists
    if (movie) {
        if (playing) {
            return (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-black">
                    <video
                        src={movie.data.max || movie.data["480"]}
                        poster={movie.preview}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                    />
                </div>
            );
        }
        return (
            <button
                onClick={() => setPlaying(true)}
                className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] hover:border-tp-accent/40 shadow-2xl focus:outline-none transition-colors"
                aria-label={`Play ${gameName} trailer`}
            >
                <Image
                    src={movie.preview}
                    alt={`${gameName} — Official Trailer`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-tp-accent/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-tp-accent/40 group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                        Official Reveal Trailer · Click to Play
                    </p>
                </div>
            </button>
        );
    }

    // Fallback — no trailer, show game background as stylized preview card
    return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
            {backgroundImage ? (
                <Image
                    src={backgroundImage}
                    alt={`${gameName} preview`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-[#0B0E14]" />
            )}
            {/* Dark vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center backdrop-blur-sm">
                    <Film className="w-6 h-6 text-white/30" />
                </div>
                <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                        Trailer Not Yet Available
                    </p>
                    <p className="text-[10px] text-white/20 mt-1">
                        Check back closer to release
                    </p>
                </div>
            </div>

            {/* Game name watermark bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                    {gameName}
                </p>
            </div>
        </div>
    );
}
