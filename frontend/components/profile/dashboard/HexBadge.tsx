"use client";

import type { ReactNode } from "react";

/**
 * Hexagon medal/tier badge (flat-top) built with clip-path. Renders a colored
 * border-hex with a slightly darker inner hex and centered content.
 */
export default function HexBadge({
    size = 56,
    color = "#CD7F32",
    children,
    className = "",
}: {
    size?: number;
    color?: string;
    children?: ReactNode;
    className?: string;
}) {
    const hex = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";
    return (
        <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
            <div className="absolute inset-0" style={{ clipPath: hex, background: color, opacity: 0.9 }} />
            <div
                className="absolute"
                style={{ inset: 2, clipPath: hex, background: "var(--surface-1)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center" style={{ color }}>
                {children}
            </div>
        </div>
    );
}
