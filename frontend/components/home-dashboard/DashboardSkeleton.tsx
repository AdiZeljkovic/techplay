"use client";

/**
 * Mirrors DashboardHome's geometry (profile hero + tab strip, highlight
 * strip, 8/4 grid) so the skeleton → data swap causes no layout shift.
 * Also shown by HomeGate while auth resolves — keep it deterministic.
 */
export default function DashboardSkeleton() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <div className="container-page py-8 space-y-6 animate-pulse">
                {/* Profile hero — tab strip is inside it */}
                {/* banner identity, record strip, section bar */}
                <div className="space-y-4">
                    <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[330px]" />
                    <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[88px]" />
                    <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[58px]" />
                </div>

                {/* three pillars */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[290px]" />
                    <div className="lg:col-span-4 rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[290px]" />
                    <div className="lg:col-span-3 rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[290px]" />
                </div>

                {/* editorial strip */}
                <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[250px]" />

                {/* second triptych */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[340px]" />
                    <div className="lg:col-span-4 rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[340px]" />
                    <div className="lg:col-span-3 rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[340px]" />
                </div>

                {/* the tail: full width and pairs */}
                <div className="space-y-6">
                        {/* upcoming (panel-wrapped now) */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[300px]" />
                        {/* recommended + campaign pair */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[300px]" />
                            <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[300px] hidden xl:block" />
                        </div>
                </div>
            </div>
        </main>
    );
}
