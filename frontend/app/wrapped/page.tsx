"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Canonical /wrapped entry point (used by the header nav): sends the
 * signed-in user to their own Wrapped, guests to login.
 */
export default function WrappedIndexPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        router.replace(user?.username ? `/wrapped/${user.username}` : "/login?redirect=/wrapped");
    }, [user, isLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
