"use client";

import type { ReactNode } from "react";
import UiEmptyState from "@/components/ui/EmptyState";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    hint?: string;
    cta?: ReactNode;
    compact?: boolean;
}

/**
 * Legacy adapter — forwards to the unified ui/EmptyState.
 * New code should import "@/components/ui/EmptyState" directly.
 */
export default function EmptyState({ icon, title, hint, cta, compact }: EmptyStateProps) {
    return (
        <div className="flex flex-col">
            <UiEmptyState
                variant={compact ? "compact" : "full"}
                icon={icon}
                title={title}
                body={hint}
            />
            {cta && <div className="mt-3 flex justify-center">{cta}</div>}
        </div>
    );
}
