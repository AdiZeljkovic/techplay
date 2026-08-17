"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Global Error Handler
 * Catches errors at the app level and provides recovery options.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        /**
         * The console is the visitor's, not ours.
         *
         * This is the one place on the site where an error is guaranteed to be
         * invisible to everything on the server: the request already returned
         * 200, the HTML was fine, and React failed afterwards in somebody's
         * browser. Netdata sees a healthy machine, nginx sees a served page,
         * and the reader sees this screen.
         *
         * The GlitchTip SDK reports it from here — same SDK and DSN format as
         * Sentry, self-hosted, so events stay on our own server.
         */
        /**
         * The console this writes to is the visitor's, not ours.
         *
         * A global error means React gave up rendering the whole tree, and by
         * then the request has already returned 200 with valid HTML. nginx
         * recorded a success, Netdata shows a healthy machine, and the Laravel
         * log has nothing — because nothing failed on the server. The reader is
         * simply looking at this screen instead of the site.
         *
         * `digest` is Next's hash of the server-side error, and it is the only
         * way to tie this to the corresponding server event: production strips
         * the real message from the client for safety, so the hash is the
         * thread between the two.
         */
        console.error("Global error:", error);

        Sentry.captureException(error, {
            tags: { boundary: "global" },
            extra: { digest: error.digest },
        });
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-[#0a0a12] text-white min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full mx-4 text-center">
                    {/* Error Icon */}
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold mb-2">
                        Something went wrong!
                    </h1>

                    {/* Description */}
                    <p className="text-white/45 mb-6">
                        We apologize for the inconvenience. An unexpected error has occurred.
                    </p>

                    {/* Error Details (Development only) */}
                    {process.env.NODE_ENV === "development" && error.message && (
                        <div className="mb-6 p-4 bg-white/50 rounded-[var(--radius-card)] border border-white/[0.07] text-left">
                            <p className="text-xs text-white/45 mb-1">Error message:</p>
                            <p className="text-sm text-red-400 font-mono break-words">
                                {error.message}
                            </p>
                            {error.digest && (
                                <>
                                    <p className="text-xs text-white/45 mt-3 mb-1">Digest:</p>
                                    <p className="text-xs text-white/45 font-mono">
                                        {error.digest}
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-[var(--radius-card)] transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.07] hover:bg-white/[0.12] text-white font-semibold rounded-[var(--radius-card)] transition-all"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </Link>
                    </div>

                    {/* Support Link */}
                    <p className="mt-8 text-sm text-white/45">
                        If the problem persists, please{" "}
                        <Link href="/contact" className="text-cyan-400 hover:underline">
                            contact support
                        </Link>
                        .
                    </p>
                </div>
            </body>
        </html>
    );
}
