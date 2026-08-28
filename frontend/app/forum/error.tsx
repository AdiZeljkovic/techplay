"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";

/**
 * Something in this section threw. The header, the navigation and the rest of
 * the site keep working — only this part is replaced.
 */
export default function SectionError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="container-page py-20 text-center">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                That didn&apos;t load
            </h2>
            <p className="mt-2 text-[13.5px] text-white/45">
                Something went wrong on our end. It is usually temporary.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
                <button
                    onClick={reset}
                    className="btn-command inline-flex items-center gap-2 h-10 px-5 bg-[var(--accent)] font-display text-[10px] font-black uppercase tracking-[0.12em] text-white hover:brightness-110 transition-[filter]"
                >
                    <RotateCw className="w-3.5 h-3.5" /> Try again
                </button>
                <Link
                    href="/"
                    className="btn-command btn-command-quiet inline-flex items-center h-10 px-5 bg-white/[0.04] font-display text-[10px] font-black uppercase tracking-[0.12em] text-white/55 hover:text-white transition-colors"
                >
                    Home
                </Link>
            </div>
            {error.digest && (
                <p className="mt-6 font-display text-[9px] uppercase tracking-[0.16em] text-white/45">
                    Ref {error.digest}
                </p>
            )}
        </div>
    );
}
