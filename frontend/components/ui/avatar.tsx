"use client";

import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 84 } as const;

interface AvatarProps {
    src?: string | null;
    alt: string;
    size?: keyof typeof SIZES;
    /** Accent ring for the current user / highlighted contexts. */
    ring?: boolean;
    /** Emerald presence dot. */
    online?: boolean;
    className?: string;
}

/** The one avatar — token-pure, with icon fallback and optional presence dot. */
export default function Avatar({ src, alt, size = "md", ring = false, online = false, className }: AvatarProps) {
    const px = SIZES[size];

    return (
        <span className={cn("relative inline-block shrink-0", className)} style={{ width: px, height: px }}>
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    width={px}
                    height={px}
                    unoptimized={src.includes("discord") || src.includes("gravatar")}
                    className={cn(
                        "w-full h-full rounded-full object-cover border",
                        ring ? "border-2 border-[color-mix(in_srgb,var(--accent)_40%,transparent)]" : "border-[var(--line)]"
                    )}
                />
            ) : (
                <span
                    className={cn(
                        "w-full h-full rounded-full bg-[var(--surface-2)] border flex items-center justify-center text-[var(--ink-faint)]",
                        ring ? "border-2 border-[color-mix(in_srgb,var(--accent)_40%,transparent)]" : "border-[var(--line)]"
                    )}
                >
                    <UserIcon style={{ width: px * 0.45, height: px * 0.45 }} />
                </span>
            )}
            {online && (
                <span
                    className="absolute rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]"
                    style={{ width: Math.max(8, px * 0.18), height: Math.max(8, px * 0.18), bottom: px * 0.02, right: px * 0.02 }}
                    title="Online"
                />
            )}
        </span>
    );
}
