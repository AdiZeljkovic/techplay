/**
 * Skeleton Loading Components
 * Used to show placeholder content while data is loading.
 * Provides better UX than blank screens or spinners.
 */

interface SkeletonProps {
    className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-[var(--bg-elevated)] rounded ${className}`}
            aria-hidden="true"
        />
    );
}

// Card skeleton for news/review cards
export function CardSkeleton() {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </div>
    );
}

// Grid of card skeletons
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

// Article detail skeleton
export function ArticleSkeleton() {
    return (
        <div className="space-y-8">
            {/* Hero */}
            <Skeleton className="h-[60vh] w-full rounded-none" />

            {/* Content */}
            <div className="container mx-auto px-4 max-w-4xl space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-64 w-full mt-8" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    );
}

// Sidebar skeleton
export function SidebarSkeleton() {
    return (
        <div className="space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                <Skeleton className="h-5 w-28 mb-4" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Table row skeleton
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
    return (
        <tr className="border-b border-[var(--border)]">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}
