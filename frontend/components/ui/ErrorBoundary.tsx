"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Prevents the entire app from crashing due to a single component error.
 */
export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // TODO: Send to error monitoring service like Sentry
        // if (typeof window !== 'undefined' && window.Sentry) {
        //     window.Sentry.captureException(error);
        // }
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 max-w-md text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-[var(--text-secondary)] text-sm mb-6">
                            We encountered an unexpected error. Please try again.
                        </p>
                        {this.state.error && (
                            <p className="text-xs text-[var(--text-muted)] mb-4 p-2 bg-[var(--bg-elevated)] rounded font-mono">
                                {this.state.error.message}
                            </p>
                        )}
                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
