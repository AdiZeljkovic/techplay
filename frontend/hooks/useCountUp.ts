"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` on mount (ease-out cubic, ~900ms).
 * Re-animates from the previous value when the target changes. Respects
 * prefers-reduced-motion by jumping straight to the target.
 */
export function useCountUp(target: number, durationMs = 900): number {
    const [value, setValue] = useState(0);
    const fromRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setValue(target);
            fromRef.current = target;
            return;
        }

        const from = fromRef.current;
        const delta = target - from;
        if (delta === 0) return;

        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3);
            const next = Math.round(from + delta * eased);
            setValue(next);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                fromRef.current = target;
            }
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            fromRef.current = target;
        };
    }, [target, durationMs]);

    return value;
}
