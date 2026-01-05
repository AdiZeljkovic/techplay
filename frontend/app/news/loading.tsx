import { CardGridSkeleton } from "@/components/ui/Skeleton";

/**
 * Loading state for /news page
 * Shows skeleton cards while news articles are being fetched
 */
export default function NewsLoading() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero Skeleton */}
            <div className="h-[40vh] bg-[var(--bg-elevated)] animate-pulse" />

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="h-8 w-48 bg-[var(--bg-elevated)] rounded animate-pulse mb-8" />
                <CardGridSkeleton count={9} />
            </div>
        </div>
    );
}
