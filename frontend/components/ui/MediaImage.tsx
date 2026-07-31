"use client";

import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaImageProps {
    src: string | null | undefined;
    alt: string;
    /** Required with fill so we never ship a full-width srcset for a thumbnail. */
    sizes?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
    /** Zoom-on-hover expects a `group` ancestor. */
    zoom?: boolean;
    className?: string;
}

/**
 * The one content image. next/image underneath, lazy by default,
 * graceful icon fallback when there is no artwork.
 */
export default function MediaImage({
    src,
    alt,
    sizes,
    fill = true,
    width,
    height,
    priority = false,
    zoom = false,
    className,
}: MediaImageProps) {
    if (!src) {
        return (
            <span className={cn("flex items-center justify-center w-full h-full text-[var(--ink-faint)] bg-[var(--fill-1)]", className)} aria-hidden>
                <Gamepad2 className="w-6 h-6" />
            </span>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            sizes={fill ? sizes ?? "100vw" : undefined}
            priority={priority}
            className={cn(
                "object-cover",
                zoom && "transition-transform duration-700 ease-[var(--ease-hud)] group-hover:scale-[1.04]",
                className
            )}
        />
    );
}
