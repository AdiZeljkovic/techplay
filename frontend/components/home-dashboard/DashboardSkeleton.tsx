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

                {/* Highlight strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-[88px] rounded-[var(--radius-panel)] bg-[var(--fill-2)]" />
                    <div className="h-[88px] rounded-[var(--radius-panel)] bg-[var(--fill-2)]" />
                </div>

                {/* Main + aside grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        {/* favorites rail */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[220px]" />
                        {/* achievements */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[190px]" />
                        {/* upcoming (panel-wrapped now) */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[300px]" />
                        {/* recommended + campaign pair */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[300px]" />
                            <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[300px] hidden xl:block" />
                        </div>
                        {/* reviews */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[240px]" />
                        {/* your activity (one panel now) */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[440px]" />
                        {/* feeds */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[280px]" />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        {/* currently playing */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[300px]" />
                        {/* daily missions: streak + quest board */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[430px]" />
                        {/* friends online */}
                        <div className="rounded-[var(--radius-panel)] bg-[var(--fill-2)] h-[190px]" />
                    </div>
                </div>
            </div>
        </main>
    );
}
