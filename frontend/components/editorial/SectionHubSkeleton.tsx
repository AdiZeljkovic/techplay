/**
 * The shape SectionHub settles into, drawn before the data lands.
 *
 * Kept in lockstep with the real layout on purpose — a skeleton that guesses
 * a different geometry is worse than none, because the page visibly jumps when
 * the content arrives.
 */
export default function SectionHubSkeleton() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <div className="border-b border-white/[0.07] bg-white/[0.02] h-11" />

            <div className="max-w-[1500px] mx-auto px-4 xl:px-6 py-8 grid grid-cols-1 xl:grid-cols-[1fr_324px] gap-6 items-start">
                <div className="min-w-0">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-6 items-start">
                        <div className="pl-4 space-y-3">
                            <div className="h-[50px] w-3/4 rounded bg-white/[0.05] animate-pulse" />
                            <div className="h-[50px] w-1/2 rounded bg-white/[0.05] animate-pulse" />
                            <div className="h-4 w-full rounded bg-white/[0.03] animate-pulse mt-4" />
                        </div>
                        <div className="min-h-[330px] rounded-[14px] bg-white/[0.04] animate-pulse" />
                    </div>

                    <div className="mt-7 flex flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-9 w-28 rounded-[9px] bg-white/[0.04] animate-pulse" />
                        ))}
                    </div>

                    <div className="mt-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-[300px] rounded-[12px] bg-white/[0.03] animate-pulse" />
                        ))}
                    </div>
                </div>

                <aside className="space-y-4">
                    {[210, 240, 150].map((height) => (
                        <div
                            key={height}
                            style={{ height }}
                            className="rounded-[13px] border border-white/[0.07] bg-white/[0.02] animate-pulse"
                        />
                    ))}
                </aside>
            </div>
        </main>
    );
}
