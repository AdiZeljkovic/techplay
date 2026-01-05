import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

/**
 * Custom 404 Not Found Page
 */
export default function NotFound() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* 404 Display */}
                <div className="relative mb-8">
                    <span className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-700/50 to-transparent leading-none">
                        404
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
                            <Search className="w-10 h-10 text-[var(--accent)]" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                    Page Not Found
                </h1>

                {/* Description */}
                <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Check the URL or navigate back to safety.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] font-semibold rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        Popular destinations:
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/news"
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        >
                            News
                        </Link>
                        <Link
                            href="/reviews"
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        >
                            Reviews
                        </Link>
                        <Link
                            href="/forum"
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        >
                            Forum
                        </Link>
                        <Link
                            href="/contact"
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        >
                            Contact
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
