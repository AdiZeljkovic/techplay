"use client";

import { LucideIcon } from "lucide-react";

interface ListingEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

/**
 * Empty state panel for listing pages (news, reviews, guides, hardware).
 * Dark-native, token-pure — the light-mode duals are gone.
 */
export default function ListingEmptyState({ icon: Icon, title, description }: ListingEmptyStateProps) {
    return (
        <div className="text-center py-24 bg-[var(--fill-1)] border border-dashed border-[var(--line-strong)] rounded-[var(--radius-panel)]">
            <div className="w-16 h-16 rounded-[var(--radius-panel)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center mx-auto mb-6">
                <Icon className="w-7 h-7 text-[var(--accent)]" strokeWidth={1.75} />
            </div>
            <h3 className="font-display text-[18px] font-bold text-[var(--ink-hi)] uppercase tracking-[0.04em] mb-2">{title}</h3>
            <p className="text-[var(--ink-low)] text-[14px]">{description}</p>
        </div>
    );
}
