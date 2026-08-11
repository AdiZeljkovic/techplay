"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardHome from "@/components/home-dashboard/DashboardHome";
import DashboardSkeleton from "@/components/home-dashboard/DashboardSkeleton";

/**
 * Decides between the public homepage (guests / SEO HTML) and the logged-in
 * dashboard. The route stays ISR: the server always renders the guest version,
 * and token holders swap to the dashboard client-side after hydration.
 *
 * The guest homepage arrives as an already-rendered prop rather than being
 * imported and rendered here. That distinction is the whole point: a client
 * component's imports are client components too, so importing HomeClient
 * dragged the entire public homepage into the browser bundle. Passed in from
 * page.tsx it stays on the server, and this file ships only the branch.
 *
 * IMPORTANT: auth state MUST come from hooks/useAuth (SWR on /auth/me).
 * context/AuthContext's isLoading flips false before /auth/me resolves,
 * which would flash guest content at logged-in users.
 */

const subscribeStorage = (cb: () => void) => {
    window.addEventListener("storage", cb);
    return () => window.removeEventListener("storage", cb);
};
const getTokenSnapshot = () => !!localStorage.getItem("token");
const getServerSnapshot = () => false; // SSR + hydration render = guest version, no mismatch

export default function HomeGate({ publicHome }: { publicHome: ReactNode }) {
    const hasToken = useSyncExternalStore(subscribeStorage, getTokenSnapshot, getServerSnapshot);
    const { user, isLoading } = useAuth();

    // Guests (no token): the public homepage, byte-identical to the SSR HTML.
    if (!hasToken) return publicHome;

    // Token present, /auth/me still resolving: skeleton instead of a guest flash.
    if (isLoading) return <DashboardSkeleton />;

    // Stale/invalid token: fall back to the public homepage (no redirect loops).
    if (!user) return publicHome;

    return <DashboardHome user={user} />;
}
