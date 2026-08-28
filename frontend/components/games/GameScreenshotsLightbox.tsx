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
    wrapperClassName?: string;
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
            <button onClick={onClose} aria-label="Close gallery" className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full z-10 transition-colors">
                <X className="w-6 h-6" />
            </button>
            <button aria-label="Previous screenshot" onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-5xl max-h-[80vh] mx-16" onClick={(e) => e.stopPropagation()}>
                <Image unoptimized src={images[idx].image} alt={`Screenshot ${idx + 1}`} width={1920} height={1080}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-[8px]" />
                <p className="text-center text-white/55 text-sm mt-3">{idx + 1} / {images.length}</p>
            </div>
            <button aria-label="Next screenshot" onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all">
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
}

/*
 * Screenshots are served as they arrive, not re-encoded.
 *
 * These come from Steam's CDN, and they were the entire load on the image
 * optimiser: 115,436 of 134,535 requests in the access log — 86% — every one of
 * them a `ss_*.jpg` fetched from `shared.akamai.steamstatic.com`, decoded, and
 * written back out as WebP.
 *
 * For which we kept a 17 GB cache of 260,000 entries, pruned it nightly, and
 * paid five seconds of CPU on every cold miss — on a file Steam was already
 * serving from a global CDN, already compressed, already the right size. The
 * timeouts that came out of that took the whole of techplay.gg to 502 earlier
 * on 18.08.2026, because one saturated endpoint marked the upstream dead for
 * every other route.
 *
 * `next.config` says as much in its own comment — game artwork "carries
 * `unoptimized` at the call site". The covers did. This gallery did not.
 *
 * Our own uploads still go through the optimiser; they are ours to serve.
 */
export default function GameScreenshotsLightbox({ screenshots, wrapperClassName }: Props) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    if (screenshots.length === 0) return null;

    return (
        <>
            <div className={wrapperClassName ?? "container mx-auto px-4 -mt-12 relative z-20 mb-10"}>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {screenshots.map((s, i) => (
                        <button key={s.id} onClick={() => setLightboxIdx(i)}
                            aria-label={`Open screenshot ${i + 1} of ${screenshots.length}`}
                            className="relative shrink-0 w-48 h-28 rounded-[8px] overflow-hidden border border-white/[0.07] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors group">
                            <Image unoptimized src={s.image} alt={`Screenshot ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
