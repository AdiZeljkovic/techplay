"use client";

import { useEffect, useState } from "react";

export interface Countdown {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    /** True once the target has passed, or when there is no target at all. */
    done: boolean;
}

const ZERO: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };

function remaining(target: number): Countdown {
    const ms = target - Date.now();

    if (ms <= 0) return ZERO;

    const seconds = Math.floor(ms / 1000);

    return {
        days: Math.floor(seconds / 86400),
        hours: Math.floor((seconds % 86400) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        seconds: seconds % 60,
        done: false,
    };
}

/**
 * A live countdown to an ISO timestamp, ticking once a second.
 *
 * Starts at zero on the server and on the first client render so the markup
 * matches — the real figure lands on the first tick, which is the only way a
 * clock and hydration can coexist.
 */
export function useCountdown(iso?: string | null): Countdown {
    const [left, setLeft] = useState<Countdown>(ZERO);

    useEffect(() => {
        const target = iso ? new Date(iso).getTime() : NaN;
        const tick = () => setLeft(Number.isNaN(target) ? ZERO : remaining(target));

        // Scheduled rather than called inline: a synchronous setState in an
        // effect body cascades renders, and the clock is a subscription anyway.
        const first = setTimeout(tick, 0);
        const id = setInterval(tick, 1000);

        return () => {
            clearTimeout(first);
            clearInterval(id);
        };
    }, [iso]);

    return left;
}

export default useCountdown;
