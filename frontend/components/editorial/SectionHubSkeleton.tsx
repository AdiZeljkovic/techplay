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

            <div className="container-page py-8 grid grid-cols-1 xl:grid-cols-[1fr_324px] gap-6 items-start">
                <div className="min-w-0">
                    {/* header: heading + line on the left, counts on the right */}
                    <div className="pl-4 mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                        <div className="space-y-2">
                            <div className="h-[30px] w-[240px] rounded bg-white/[0.05] animate-pulse" />
                            <div className="h-3.5 w-[320px] max-w-full rounded bg-white/[0.03] animate-pulse" />
                        </div>
                        <div className="h-3 w-[200px] rounded bg-white/[0.03] animate-pulse" />
                    </div>

                    {/* the lead story, full width */}
                    <div className="min-h-[300px] lg:min-h-[380px] rounded-[14px] bg-white/[0.04] animate-pulse" />

                    {/* tab row */}
                    <div className="mt-7 flex flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-9 w-28 rounded-[9px] bg-white/[0.04] animate-pulse" />
                        ))}
                    </div>

                    <div className="mt-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => (
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
