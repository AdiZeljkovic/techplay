"use client";

import { CheckCircle2 } from "lucide-react";
import type { Milestone } from "@/lib/types/profile";

export default function ContributionMilestones({ milestones }: { milestones: Milestone[] }) {
    return (
        <div className="space-y-4">
            {milestones.map((m) => (
                <div key={m.key}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white/75 truncate pr-2">
                            {m.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {m.label}
                        </span>
                        <span className="text-[10px] font-bold tabular-nums shrink-0 text-white/40">
                            {m.current.toLocaleString()} / {m.target.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${m.completed ? "bg-emerald-500" : "bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D]"}`}
                            style={{ width: `${Math.max(3, m.percent)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
