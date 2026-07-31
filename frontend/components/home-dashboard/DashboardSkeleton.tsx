"use client";

/**
 * Mirrors DashboardHome's geometry (hero row + right card, horizontal card row,
 * main/aside grid) so the skeleton → data swap causes no layout shift.
 */
export default function DashboardSkeleton() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)] bg-hud-grid">
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full py-8 animate-pulse">
                {/* Welcome hero row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    <div className="rounded-2xl bg-[var(--fill-2)] h-[340px]" />
                    <div className="rounded-2xl bg-[var(--fill-2)] h-[340px]" />
                </div>

                {/* Continue playing row */}
                <div className="h-5 w-44 rounded bg-[var(--fill-2)] mb-4" />
                <div className="flex gap-3 mb-10 overflow-hidden">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="w-[280px] shrink-0 rounded-[var(--radius-card)] bg-[var(--fill-2)] aspect-[16/10]" />
                    ))}
                </div>

                {/* Main + aside grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[220px]" />
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[280px]" />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[90px]" />
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[220px]" />
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[180px]" />
                    </div>
                </div>
            </div>
        </main>
    );
}
