"use client";

import { useEffect, useState } from "react";

const RELEASE_DATE = new Date("2026-11-19T00:00:00");

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOut: boolean;
}

function calc(): TimeLeft {
    const diff = RELEASE_DATE.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOut: true };
    return {
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isOut:   false,
    };
}

function Unit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="min-w-[62px] md:min-w-[88px] px-2 py-3 md:py-4 rounded-[var(--radius-card)] bg-[var(--surface-1)]/80 backdrop-blur-sm border border-[var(--gta-pink)]/25 text-center gta6-glow-pink">
                <span className="font-display text-[28px] md:text-[44px] font-black text-white tabular-nums leading-none gta6-text-glow">
                    {String(value).padStart(2, "0")}
                </span>
            </div>
            <span className="mt-2 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gta-cyan)]">
                {label}
            </span>
        </div>
    );
}

export default function Gta6Countdown() {
    // Start null to avoid SSR/client hydration mismatch — render after mount
    const [time, setTime] = useState<TimeLeft | null>(null);

    useEffect(() => {
        setTime(calc());
        const id = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(id);
    }, []);

    if (!time) {
        // Stable placeholder during hydration
        return <div className="h-[92px] md:h-[116px]" aria-hidden />;
    }

    if (time.isOut) {
        return (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-card)] bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/40 text-[var(--gta-pink)] font-display font-black text-[20px] uppercase tracking-wider">
                Out Now
            </div>
        );
    }

    return (
        <div className="flex items-start gap-2 md:gap-3">
            <Unit value={time.days}    label="Days" />
            <span className="font-display text-[28px] md:text-[40px] font-black text-[var(--gta-pink)]/40 leading-none pt-3 md:pt-4">:</span>
            <Unit value={time.hours}   label="Hours" />
            <span className="font-display text-[28px] md:text-[40px] font-black text-[var(--gta-pink)]/40 leading-none pt-3 md:pt-4">:</span>
            <Unit value={time.minutes} label="Min" />
            <span className="font-display text-[28px] md:text-[40px] font-black text-[var(--gta-pink)]/40 leading-none pt-3 md:pt-4">:</span>
            <Unit value={time.seconds} label="Sec" />
        </div>
    );
}
