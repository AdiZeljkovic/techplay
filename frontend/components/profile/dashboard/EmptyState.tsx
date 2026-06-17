"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    hint?: string;
    cta?: ReactNode;
    compact?: boolean;
}

/**
 * Polished empty/locked state for dashboard sections whose backend
 * system has not shipped yet (or that have no data for this user).
 */
export default function EmptyState({ icon, title, hint, cta, compact }: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-6" : "py-10"}`}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 mb-3">
                {icon}
            </div>
            <p className="text-[13px] font-semibold text-white/55">{title}</p>
            {hint && <p className="text-[11px] text-white/30 mt-1 max-w-[240px]">{hint}</p>}
            {cta && <div className="mt-4">{cta}</div>}
        </div>
    );
}
