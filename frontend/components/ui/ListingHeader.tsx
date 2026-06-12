"use client";

interface ListingHeaderProps {
    title: string;
    count: number;
    countLabel?: string; // e.g. "ARTICLES FOUND"
    extra?: React.ReactNode; // optional inline extra next to the title (e.g. search query)
}

/**
 * Section header row used at the top of listing grids (news, reviews, guides, hardware).
 */
export default function ListingHeader({ title, count, countLabel = "ITEMS FOUND", extra }: ListingHeaderProps) {
    return (
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-white/5">
            <div className="flex items-center gap-3">
                <span className="w-1.5 h-5 bg-tp-accent rounded-sm shrink-0" />
                <h2 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.04em] leading-none">
                    {title}
                </h2>
                {extra}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] leading-none">
                {count} {countLabel}
            </span>
        </div>
    );
}
