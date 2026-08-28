"use client";

import { useState } from "react";
import { Play } from "lucide-react";

// Editable config — redakcija can confirm/replace YouTube IDs.
const TRAILERS: { id: string; title: string; date: string }[] = [
    { id: "QdBZY2fkU-0", title: "GTA VI — Trailer 1", date: "Dec 2023" },
    { id: "VQRLujxTm3c", title: "GTA VI — Trailer 2", date: "May 2025" },
];

function Trailer({ id, title, date }: { id: string; title: string; date: string }) {
    const [playing, setPlaying] = useState(false);

    return (
        <div className="group relative rounded-[var(--radius-card)] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] gta6-card">
            <div className="relative aspect-video w-full bg-[var(--surface-2)]">
                {playing ? (
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <button onClick={() => setPlaying(true)} className="absolute inset-0 w-full h-full" aria-label={`Play ${title}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                            alt={title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[var(--gta-pink)] flex items-center justify-center gta6-glow-pink group-hover:scale-110 transition-transform">
                            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                        </span>
                    </button>
                )}
            </div>
            <div className="p-4 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-white">{title}</h3>
                <span className="text-[11px] text-white/50 uppercase tracking-wide">{date}</span>
            </div>
        </div>
    );
}

export default function Gta6Trailers() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRAILERS.map(t => <Trailer key={t.id} {...t} />)}
        </div>
    );
}
