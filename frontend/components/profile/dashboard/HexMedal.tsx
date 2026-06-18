"use client";

import type { ReactNode } from "react";

const HEX = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";

/**
 * Layered hexagon medal — metallic rim + dark inner + centered icon. Used for
 * tier/rank medals (Community Ranking, Loyalty).
 */
export default function HexMedal({ size = 64, color = "#CD7F32", children, className = "" }: { size?: number; color?: string; children?: ReactNode; className?: string }) {
    return (
        <div className={`relative shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${className}`} style={{ width: size, height: size }}>
            <div className="absolute inset-0" style={{ clipPath: HEX, background: `linear-gradient(145deg, ${color}, ${color}66)` }} />
            <div className="absolute inset-[7%]" style={{ clipPath: HEX, background: "linear-gradient(145deg, rgba(0,0,0,0.45), rgba(0,0,0,0.8))" }} />
            <div className="absolute inset-0 flex items-center justify-center" style={{ color }}>{children}</div>
        </div>
    );
}
