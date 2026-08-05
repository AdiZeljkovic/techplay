"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

/**
 * Where a page lands when it could not be built.
 *
 * There was no route-level error boundary before this, which is part of why
 * a failing request showed up as "page not found": every detail page turned
 * any failure into notFound() because that was the only outcome it had.
 *
 * This says the honest thing instead — something broke on our side, here is
 * the button to try again — and never claims the content does not exist.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Page failed to render:", error);
    }, [error]);

    return (
        <main className="min-h-[70vh] bg-[var(--surface-0)] grid place-items-center px-4">
            <div className="w-full max-w-[440px] text-center">
                <p className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    Something went wrong
                </p>

                <h1 className="mt-3 font-display text-[30px] md:text-[36px] font-black uppercase leading-[0.95] text-white">
                    That didn&apos;t load
                </h1>

                <p className="mt-4 text-[13.5px] text-white/50 leading-relaxed">
                    The page is there — we just couldn&apos;t reach it this time. Trying again
                    usually sorts it.
                </p>

                <div className="mt-7 flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 h-11 px-6 rounded-[10px] bg-[var(--accent)] hover:brightness-110 font-display text-[11px] font-black uppercase tracking-[0.1em] text-white transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 h-11 px-6 rounded-[10px] bg-white/[0.05] hover:bg-white/[0.09] font-display text-[11px] font-black uppercase tracking-[0.1em] text-white/70 hover:text-white transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Link>
                </div>

                {error.digest && (
                    <p className="mt-8 font-mono text-[10.5px] text-white/20">
                        Reference {error.digest}
                    </p>
                )}
            </div>
        </main>
    );
}
