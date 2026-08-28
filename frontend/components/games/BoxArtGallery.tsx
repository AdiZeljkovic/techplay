"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface BoxArt {
    image: string;
    thumbnail: string | null;
    label: string | null;
}

/**
 * The physical release, scanned: front covers, backs, regional variants.
 * A grid of thumbnails with the same full-screen viewer the screenshots
 * strip uses — collectors are the audience here, and they zoom.
 */
export default function BoxArtGallery({ art }: { art: BoxArt[] }) {
    const [open, setOpen] = useState<number | null>(null);

    const prev = useCallback(() => setOpen((i) => (i === null ? null : (i - 1 + art.length) % art.length)), [art.length]);
    const next = useCallback(() => setOpen((i) => (i === null ? null : (i + 1) % art.length)), [art.length]);

    useEffect(() => {
        if (open === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(null);
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, prev, next]);

    if (art.length === 0) return null;

    return (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {art.map((cover, i) => (
                    <button
                        key={cover.image}
                        onClick={() => setOpen(i)}
                        className="group text-left"
                    >
                        <span className="relative block aspect-[3/4] rounded-[5px] overflow-hidden border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors bg-black/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={cover.thumbnail ?? cover.image}
                                alt={cover.label ?? "Box art"}
                                loading="lazy"
                                className="w-full h-full object-contain"
                            />
                        </span>
                        {cover.label && (
                            <span className="mt-1.5 block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/50 group-hover:text-white/60 transition-colors truncate">
                                {cover.label}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {open !== null && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setOpen(null)}>
                    <button onClick={() => setOpen(null)}
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-[8px] z-10 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); prev(); }}
                        className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-[8px] z-10 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="relative max-w-3xl max-h-[85vh] mx-16" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={art[open].image} alt={art[open].label ?? "Box art"} className="max-h-[80vh] w-auto object-contain" />
                        <p className="text-center mt-3 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
                            {art[open].label ?? "Box art"} · {open + 1} / {art.length}
                        </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); next(); }}
                        className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-[8px] z-10 transition-colors">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            )}
        </>
    );
}
