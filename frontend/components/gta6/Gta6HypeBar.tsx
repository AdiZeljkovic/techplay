"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Clapperboard, CalendarDays, Hourglass } from "lucide-react";

const RELEASE_DATE = new Date("2026-11-19T00:00:00");

function daysLeft(): number {
    const diff = RELEASE_DATE.getTime() - Date.now();
    return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
}

function useCountUp(target: number, run: boolean, ms = 900): number {
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

interface Props {
    locations: number;
    trailers?: number;
}

export default function Gta6HypeBar({ locations, trailers = 2 }: Props) {
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

    const days = useCountUp(daysLeft(), run);
    const locs = useCountUp(locations, run);

    const stats = [
        { icon: Hourglass,    value: days.toLocaleString(),  label: "Days to launch" },
        { icon: MapPin,       value: locs.toLocaleString(),  label: "Mapped locations" },
        { icon: Clapperboard, value: String(trailers),       label: "Official trailers" },
        { icon: CalendarDays, value: "Nov 19",               label: "2026" },
    ];

    return (
        <div ref={ref} className="relative border-y border-[#161B22] bg-[#0B0E14]/60">
            <div className="absolute inset-0 gta6-sunset opacity-30 pointer-events-none" />
            <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--gta-pink)]/12 border border-[var(--gta-pink)]/30 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-[var(--gta-pink)]" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-display text-[22px] md:text-[26px] font-black text-white leading-none tabular-nums">{value}</p>
                            <p className="text-[11px] text-[#71717A] uppercase tracking-wide mt-1 truncate">{label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
