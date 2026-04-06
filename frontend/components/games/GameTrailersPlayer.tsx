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
    movies: Movie[];
}

export default function GameTrailersPlayer({ movies }: Props) {
    const [activeTrailer, setActiveTrailer] = useState(0);

    if (movies.length === 0) return null;

    return (
        <div className="bg-[#0f1221]/80 border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                <Play className="w-5 h-5 text-[var(--accent)]" />
                Trailers & Videos
            </h2>

            <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
                <video
                    key={movies[activeTrailer]?.data?.max}
                    controls
                    poster={movies[activeTrailer]?.preview}
                    className="w-full max-h-[400px] bg-black"
                >
                    <source src={movies[activeTrailer]?.data?.max} type="video/mp4" />
                    <source src={movies[activeTrailer]?.data?.["480"]} type="video/mp4" />
                </video>
            </div>

            {movies.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {movies.map((m, i) => (
                        <button key={m.id} onClick={() => setActiveTrailer(i)}
                            className={`relative shrink-0 w-36 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeTrailer === i ? "border-[var(--accent)]" : "border-transparent hover:border-white/30"}`}>
                            <Image src={m.preview} alt={m.name} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white" fill="white" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {movies[activeTrailer] && (
                <p className="text-xs text-gray-400 mt-3">{movies[activeTrailer].name}</p>
            )}
        </div>
    );
}
