"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ListingPaginationProps {
    page: number;
    lastPage?: number;
    onPrev: () => void;
    onNext: () => void;
    prevDisabled?: boolean;
    nextDisabled?: boolean;
}

/**
 * Pagination row used on listing pages (news, reviews, guides, hardware).
 */
export default function ListingPagination({ page, lastPage, onPrev, onNext, prevDisabled, nextDisabled }: ListingPaginationProps) {
    return (
        <div className="flex items-center justify-center gap-2 mb-12">
            <button
                onClick={onPrev}
                disabled={prevDisabled}
                className="flex items-center gap-1.5 h-[42px] px-5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/[0.07] text-white/45 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/[0.07] disabled:hover:text-white/45"
            >
                <ChevronLeft className="w-4 h-4" />
                Previous
            </button>

            <div className="h-[42px] px-5 flex items-center bg-[var(--surface-0)] border border-white/[0.07] rounded-[var(--radius-card)] text-[11px] font-bold uppercase tracking-wider text-white/35">
                Page&nbsp;<span className="text-[var(--accent)]">{page}</span>{lastPage ? <>&nbsp;of&nbsp;{lastPage}</> : null}
            </div>

            <button
                onClick={onNext}
                disabled={nextDisabled}
                className="flex items-center gap-1.5 h-[42px] px-5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/[0.07] text-white/45 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/[0.07] disabled:hover:text-white/45"
            >
                Next
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
