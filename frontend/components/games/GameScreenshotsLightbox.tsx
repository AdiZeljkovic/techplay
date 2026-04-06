"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Screenshot {
    id: number;
    image: string;
    width: number;
    height: number;
}

interface Props {
    screenshots: Screenshot[];
}

function Lightbox({ images, initial, onClose }: {
    images: Screenshot[];
    initial: number;
    onClose: () => void;
}) {
    const [idx, setIdx] = useState(initial);

    const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, prev, next]);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full z-10 transition-colors">
                <X className="w-6 h-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-5xl max-h-[80vh] mx-16" onClick={(e) => e.stopPropagation()}>
                <Image src={images[idx].image} alt={`Screenshot ${idx + 1}`} width={1920} height={1080}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
                <p className="text-center text-white/40 text-sm mt-3">{idx + 1} / {images.length}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all">
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
}

export default function GameScreenshotsLightbox({ screenshots }: Props) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    if (screenshots.length === 0) return null;

    return (
        <>
            <div className="container mx-auto px-4 -mt-12 relative z-20 mb-10">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {screenshots.map((s, i) => (
                        <button key={s.id} onClick={() => setLightboxIdx(i)}
                            className="relative shrink-0 w-48 h-28 rounded-xl overflow-hidden border border-white/10 hover:border-[var(--accent)] transition-all group">
                            <Image src={s.image} alt={`Screenshot ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                                <Camera className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {lightboxIdx !== null && (
                <Lightbox images={screenshots} initial={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}
        </>
    );
}
