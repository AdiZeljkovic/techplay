"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import type { DashboardStats } from "@/lib/types/dashboard";

const STATUS = [
    { key: "playing_count", label: "Playing", color: "#34d399" },
    { key: "backlog_count", label: "Backlog", color: "#60a5fa" },
    { key: "completed_count", label: "Completed", color: "#22c55e" },
] as const;

export default function BacklogProgressCard({ stats }: { stats: DashboardStats }) {
    const total = stats.playing_count + stats.backlog_count + stats.completed_count;
    if (total === 0) return null;

    const percent = Math.round((stats.completed_count / total) * 100);

    // SVG donut geometry
    const r = 40;
    const circumference = 2 * Math.PI * r;
    const dash = (percent / 100) * circumference;

    return (
        <SectionCard title="Backlog Progress" icon={<ListChecks className="w-3.5 h-3.5 text-[var(--accent)]" />}>
            <div className="flex items-center gap-5">
                <div className="relative shrink-0 w-[104px] h-[104px]">
                    <svg viewBox="0 0 104 104" className="w-full h-full -rotate-90">
                        <circle cx="52" cy="52" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                        <circle
                            cx="52" cy="52" r={r} fill="none"
                            stroke="#22c55e" strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[20px] font-black text-white tabular-nums">{percent}%</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">Completed</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2.5">
                    {STATUS.map((s) => (
                        <div key={s.key} className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="flex-1 text-[12px] text-white/55">{s.label}</span>
                            <span className="text-[13px] font-bold text-white tabular-nums">{stats[s.key]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Link
                href="/backlog-advisor"
                className="mt-4 flex items-center justify-center h-10 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors"
            >
                Open Backlog Advisor
            </Link>
        </SectionCard>
    );
}
