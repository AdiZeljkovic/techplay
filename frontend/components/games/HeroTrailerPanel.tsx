"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

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
}

export default function HeroTrailerPanel({ youtubeId, movie, gameName }: Props) {
    const [playing, setPlaying] = useState(false);

    if (!youtubeId && !movie) return null;

    // YouTube embed — always shows as iframe
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
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1.5">
                        Official Reveal Trailer
                        <span className="text-white/25">·</span>
                        Watch on YouTube
                    </p>
                </div>
            </div>
        );
    }

    // RAWG movie — poster + play button → inline video on click
    if (!playing) {
        return (
            <button
                onClick={() => setPlaying(true)}
                className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] hover:border-tp-accent/40 shadow-2xl focus:outline-none transition-colors"
                aria-label={`Play ${gameName} trailer`}
            >
                <Image
                    src={movie!.preview}
                    alt={`${gameName} — Official Trailer`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 transition-colors" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-tp-accent/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-tp-accent/40 group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                </div>

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                        Official Reveal Trailer · Click to Play
                    </p>
                </div>
            </button>
        );
    }

    // Playing — inline video
    return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-black">
            <video
                src={movie!.data.max || movie!.data["480"]}
                poster={movie!.preview}
                controls
                autoPlay
                className="w-full h-full object-contain"
            />
        </div>
    );
}
