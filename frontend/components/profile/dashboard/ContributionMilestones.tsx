"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { Milestone } from "@/lib/types/profile";

export default function ContributionMilestones({ milestones }: { milestones: Milestone[] }) {
    return (
        <div className="space-y-1">
            {milestones.map((m) => (
                <div key={m.key} className="flex items-center gap-2.5 py-2">
                    {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                        <Circle className="w-4 h-4 text-white/25 shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 text-[12.5px] text-white/65 truncate">{m.label}</span>
                    <span className="text-[11px] font-bold tabular-nums shrink-0 text-white/45">
                        {m.current.toLocaleString("en-US")} / {m.target.toLocaleString("en-US")}
                    </span>
                </div>
            ))}
        </div>
    );
}
