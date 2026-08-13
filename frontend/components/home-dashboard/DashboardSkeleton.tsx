"use client";

/** One placeholder panel, at the height its real counterpart settles on. */
function Block({ h, className = "" }: { h: number; className?: string }) {
    return (
        <div
            className={`rounded-[var(--radius-panel)] bg-[var(--fill-2)] ${className}`}
            style={{ height: h }}
        />
    );
}

/**
 * Mirrors DashboardHome's geometry so the skeleton → data swap causes no
 * layout shift. It had drifted a long way from it — two 5/4/3 triptychs that
 * the page has not drawn in some time — so the placeholder was reserving
 * space in a shape nothing ever filled.
 *
 * Also shown by HomeGate while auth resolves — keep it deterministic.
 */
export default function DashboardSkeleton() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <div className="container-page py-6 space-y-5 animate-pulse">
                {/* banner identity, record strip, section bar */}
                <div className="space-y-4">
                    <Block h={330} />
                    <Block h={88} />
                    <Block h={58} />
                </div>

                {/* today: continue playing | favourites | daily hub,
                    with achievements filling the depth Today leaves */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <Block h={296} className="lg:col-span-3" />
                    <Block h={296} className="lg:col-span-5" />
                    <Block h={520} className="lg:col-span-4 lg:row-span-2 self-start" />
                    <Block h={300} className="lg:col-span-8" />
                </div>

                {/* editorial strip | friends */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <Block h={420} className="lg:col-span-8" />
                    <Block h={420} className="lg:col-span-4" />
                </div>

                {/* upcoming */}
                <Block h={330} />

                {/* recommended + campaign pair */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <Block h={480} />
                    <Block h={480} className="hidden xl:block" />
                </div>
            </div>
        </main>
    );
}
