"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number up to `target` on mount (ease-out cubic), and from
 * wherever it currently sits when the target changes. Respects
 * prefers-reduced-motion by jumping straight there.
 *
 * The invariant, and the reason this was rewritten: **the value always ends up
 * at the target.** An animation is a way of arriving, never a way of deciding
 * where to stop.
 *
 * It used to be able to stop short. Two faults together:
 *
 *   - The cleanup cancelled the frame and then set its "we are at" marker to
 *     the target — claiming the climb had finished when it had just been
 *     interrupted, possibly at 3%.
 *   - The next run opened with `if (target - from === 0) return`, which read
 *     that marker, agreed there was nothing to do, and returned without ever
 *     looking at what was on screen.
 *
 * So a run cancelled and restarted on the same target left the number frozen
 * whereever the cancelled frame had reached — a different place every time,
 * because it depends on how many frames got through. The XP gauge on the
 * dashboard was the visible one; the hook has sixteen callers and any of them
 * could do it.
 *
 * Now the marker tracks the frame actually painted, and the no-animation path
 * still sets the value. Neither an interruption nor a skipped animation can
 * leave the number somewhere other than the target.
 */
export function useCountUp(target: number, durationMs = 900): number {
    const [value, setValue] = useState(0);
    /** The last number actually painted — not the one a cancelled run aimed at. */
    const paintedRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const reduced =
            typeof window !== "undefined"
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Nothing to animate — but the number still has to be right.
        // Written as an updater so React bails out when it already is, rather
        // than scheduling a render to set a value to itself.
        if (reduced || paintedRef.current === target) {
            paintedRef.current = target;
            setValue((v) => (v === target ? v : target));
            return;
        }

        const from = paintedRef.current;
        const delta = target - from;
        const start = performance.now();

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3);
            // At t === 1 this is exactly `target`, so the climb lands on it
            // rather than near it.
            const next = Math.round(from + delta * eased);

            paintedRef.current = next;
            setValue(next);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            // Deliberately leaves `paintedRef` alone: it holds the last frame
            // drawn, which is where the next run must pick up from.
        };
    }, [target, durationMs]);

    return value;
}
