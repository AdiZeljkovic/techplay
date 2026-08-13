"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
    /** File in /images/profile — the rendered object. */
    src: string;
    size?: number;
    /** Alive objects breathe and catch light; spent ones sit still and grey. */
    active?: boolean;
    /**
     * Idle behaviour when there is nothing to react to. `flicker` is for the
     * flame, `pulse` for the crate — everything else holds still, because six
     * animating things at once is a screensaver.
     */
    idle?: "none" | "flicker" | "pulse";
    className?: string;
}

/** How far the object turns at the far edge of its cell. */
const MAX_TILT = 14;

/**
 * A rendered object that behaves like one.
 *
 * The six stat icons were already 3D renders and already the right style —
 * dark, crimson-lit, heavy — and they were pasted in as flat `<img>` with a
 * drop shadow, which is a photograph of a 3D object rather than a 3D object.
 *
 * Three things make the difference, and none of them needs a renderer for a
 * 60-pixel icon:
 *
 *   the turn        the object rotates toward the pointer, so it reads as
 *                   sitting in space rather than printed on the panel
 *   the specular    a highlight travels across it, masked to the object's own
 *                   silhouette — this is the part that sells it, because a
 *                   highlight on a square would just be a shiny card
 *   the lift        it rises toward the reader on approach
 *
 * Everything is written straight to CSS custom properties on the node. No
 * state, so no re-render on pointer move — six of these on one strip would
 * otherwise re-render the hero on every mouse event.
 */
export default function StatIcon({ src, size = 60, active = true, idle = "none", className = "" }: Props) {
    const ref = useRef<HTMLSpanElement>(null);

    const track = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
        const node = ref.current;
        if (!node) return;

        const rect = node.getBoundingClientRect();
        // −1 … 1 from the centre of the cell.
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        node.style.setProperty("--tilt-x", `${(-y * MAX_TILT).toFixed(2)}deg`);
        node.style.setProperty("--tilt-y", `${(x * MAX_TILT).toFixed(2)}deg`);
        // The light lands where the pointer is, in the icon's own space.
        node.style.setProperty("--spec-x", `${(50 + x * 45).toFixed(1)}%`);
        node.style.setProperty("--spec-y", `${(50 + y * 45).toFixed(1)}%`);
        node.style.setProperty("--spec-o", "1");
    }, []);

    const rest = useCallback(() => {
        const node = ref.current;
        if (!node) return;

        node.style.setProperty("--tilt-x", "0deg");
        node.style.setProperty("--tilt-y", "0deg");
        node.style.setProperty("--spec-o", "0");
    }, []);

    return (
        <span
            ref={ref}
            onPointerMove={track}
            onPointerLeave={rest}
            className={cn("tp-stat-icon relative shrink-0 block select-none", !active && "is-spent", className)}
            style={{ width: size, height: size }}
        >
            {/* Two layers, because they both want `transform`: the body
                turns toward the pointer, the image breathes. On one element
                the animation would win and the flame would never tilt. */}
            <span className="tp-stat-icon-body relative block w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt=""
                    aria-hidden
                    width={size}
                    height={size}
                    className={cn(
                        "w-full h-full object-contain",
                        active && idle === "flicker" && "tp-stat-flicker",
                        active && idle === "pulse" && "tp-stat-pulse",
                    )}
                />

                {/* The highlight, cut to the object's own outline. A gradient
                    over the bounding box would read as a shiny rectangle; cut
                    to the silhouette it reads as light on a surface. */}
                <span
                    aria-hidden
                    className="tp-stat-spec absolute inset-0 pointer-events-none"
                    style={{
                        WebkitMaskImage: `url(${src})`,
                        maskImage: `url(${src})`,
                    }}
                />
            </span>
        </span>
    );
}
