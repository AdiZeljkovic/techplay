"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface SectionCardProps {
    title: string;
    icon?: ReactNode;
    action?: { label: string; href?: string; onClick?: () => void };
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}

/**
 * Standard dashboard panel used across the profile overview.
 * Header row with an orange accent bar + optional "view all" action.
 */
export default function SectionCard({ title, icon, action, children, className = "", bodyClassName = "" }: SectionCardProps) {
    return (
        <section className={`rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] overflow-hidden ${className}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                <h3 className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    {icon}
                    {title}
                </h3>
                {action && (
                    action.href ? (
                        <Link href={action.href} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-[var(--accent)] transition-colors">
                            {action.label} <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    ) : (
                        <button onClick={action.onClick} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-[var(--accent)] transition-colors">
                            {action.label} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    )
                )}
            </div>
            <div className={`p-5 ${bodyClassName}`}>{children}</div>
        </section>
    );
}
