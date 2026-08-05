export default function Loading() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <div className="max-w-[1500px] mx-auto px-4 xl:px-6 py-8">
                <div className="pl-4 space-y-3">
                    <div className="h-[50px] w-[320px] rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-4 w-[420px] max-w-full rounded bg-white/[0.03] animate-pulse" />
                </div>
                <div className="mt-7 flex gap-2">
                    <div className="h-10 w-32 rounded-[10px] bg-white/[0.04] animate-pulse" />
                    <div className="h-10 w-32 rounded-[10px] bg-white/[0.04] animate-pulse" />
                </div>
                <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-[310px] rounded-[12px] bg-white/[0.03] animate-pulse" />
                    ))}
                </div>
            </div>
        </main>
    );
}
