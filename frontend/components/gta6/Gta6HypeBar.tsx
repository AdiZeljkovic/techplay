"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Clapperboard, CalendarDays, Hourglass, Users, Newspaper, Car, Crosshair } from "lucide-react";

const ICONS = { MapPin, Clapperboard, CalendarDays, Hourglass, Users, Newspaper, Car, Crosshair } as const;
type IconName = keyof typeof ICONS;

export interface HypeStat {
    icon: IconName;
    /** numeric value → animated count-up; string → shown as-is */
    value: number | string;
    label: string;
    sub?: string;
}

function useCountUp(target: number, run: boolean, ms = 1000): number {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!run) return;
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / ms);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(target * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, run, ms]);
    return val;
}

function StatItem({ stat, run }: { stat: HypeStat; run: boolean }) {
    const Icon = ICONS[stat.icon];
    const numeric = typeof stat.value === "number";
    const counted = useCountUp(numeric ? (stat.value as number) : 0, run);
    const display = numeric ? counted.toLocaleString() : (stat.value as string);

    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-card)] bg-[var(--gta-pink)]/12 border border-[var(--gta-pink)]/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[var(--gta-pink)]" />
            </div>
            <div className="min-w-0">
                <p className="font-display text-[22px] md:text-[26px] font-black text-white leading-none tabular-nums">{display}</p>
                <p className="text-[11px] text-white/90 font-semibold uppercase tracking-wide mt-1 truncate">{stat.label}</p>
                {stat.sub && <p className="text-[10px] text-white/35 truncate">{stat.sub}</p>}
            </div>
        </div>
    );
}

export default function Gta6HypeBar({ stats }: { stats: HypeStat[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const [run, setRun] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setRun(true); io.disconnect(); }
        }, { threshold: 0.3 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div className="container-page mt-5">
            <div ref={ref} className="relative rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] overflow-hidden">
                <div className="absolute inset-0 gta6-sunset opacity-25 pointer-events-none" />
                <div className="relative px-5 md:px-8 py-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    {stats.map((s) => <StatItem key={s.label} stat={s} run={run} />)}
                </div>
            </div>
        </div>
    );
}
