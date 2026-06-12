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
                className="flex items-center gap-1.5 h-[42px] px-5 rounded-lg bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] text-zinc-700 dark:text-[#A1A1AA] hover:border-tp-accent/40 hover:text-tp-accent text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-200 dark:disabled:hover:border-[#161B22] disabled:hover:text-zinc-700 dark:disabled:hover:text-[#A1A1AA]"
            >
                <ChevronLeft className="w-4 h-4" />
                Previous
            </button>

            <div className="h-[42px] px-5 flex items-center bg-zinc-50 dark:bg-[#05070A] border border-zinc-200 dark:border-[#161B22] rounded-lg text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#71717A]">
                Page&nbsp;<span className="text-tp-accent">{page}</span>{lastPage ? <>&nbsp;of&nbsp;{lastPage}</> : null}
            </div>

            <button
                onClick={onNext}
                disabled={nextDisabled}
                className="flex items-center gap-1.5 h-[42px] px-5 rounded-lg bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] text-zinc-700 dark:text-[#A1A1AA] hover:border-tp-accent/40 hover:text-tp-accent text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-200 dark:disabled:hover:border-[#161B22] disabled:hover:text-zinc-700 dark:disabled:hover:text-[#A1A1AA]"
            >
                Next
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
