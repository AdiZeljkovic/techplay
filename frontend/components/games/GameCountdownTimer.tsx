"use client";

import { useState, useEffect } from "react";

interface Props {
    targetDate: string;
}

export default function GameCountdownTimer({ targetDate }: Props) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calc = () => {
            const diff = Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000);
            if (diff <= 0) return null;
            return {
                days:    Math.floor(diff / (3600 * 24)),
                hours:   Math.floor((diff % (3600 * 24)) / 3600),
                minutes: Math.floor((diff % 3600) / 60),
                seconds: Math.floor(diff % 60),
            };
        };
        setTimeLeft(calc());
        const t = setInterval(() => setTimeLeft(calc()), 1000);
        return () => clearInterval(t);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <div className="flex flex-wrap gap-4">
            {(["Days", "Hours", "Mins", "Secs"] as const).map((label, i) => {
                const val = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds][i];
                return (
                    <div key={label} className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-[var(--accent)]/50 p-4 rounded-[var(--radius-panel)] min-w-[90px] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                        <span className="text-4xl font-black text-white font-mono">{String(val).padStart(2, "0")}</span>
                        <span className="text-[10px] uppercase text-[var(--accent)] font-bold tracking-widest mt-1">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}
