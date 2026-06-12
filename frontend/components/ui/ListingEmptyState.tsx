"use client";

import { LucideIcon } from "lucide-react";

interface ListingEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

/**
 * Empty state panel for listing pages (news, reviews, guides, hardware).
 */
export default function ListingEmptyState({ icon: Icon, title, description }: ListingEmptyStateProps) {
    return (
        <div className="text-center py-24 bg-white dark:bg-[#0B0E14]/50 border border-dashed border-zinc-200 dark:border-[#161B22] rounded-[24px] transition-colors duration-300">
            <div className="w-16 h-16 rounded-2xl bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center mx-auto mb-6">
                <Icon className="w-7 h-7 text-tp-accent" strokeWidth={1.75} />
            </div>
            <h3 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.04em] mb-2">{title}</h3>
            <p className="text-zinc-500 dark:text-[#71717A] text-[14px]">{description}</p>
        </div>
    );
}
