"use client";

import { ListChecks } from "lucide-react";

/** 2×2 cover collage for a game list (falls back to icon when empty). */
export default function ListCoverCollage({ covers, className = "" }: { covers: string[]; className?: string }) {
    if (!covers || covers.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-white/[0.04] text-white/20 ${className}`}>
                <ListChecks className="w-7 h-7" />
            </div>
        );
    }
    const tiles = covers.slice(0, 4);
    return (
        <div className={`grid ${tiles.length === 1 ? "grid-cols-1" : "grid-cols-2"} ${tiles.length > 2 ? "grid-rows-2" : "grid-rows-1"} gap-px bg-black/40 ${className}`}>
            {tiles.map((src, i) => (
                <img key={i} src={src} alt="" className="w-full h-full object-cover" />
            ))}
        </div>
    );
}
