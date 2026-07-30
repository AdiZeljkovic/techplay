"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/useAuth";
import HomeClient from "./HomeClient";
import DashboardHome from "@/components/home-dashboard/DashboardHome";
import DashboardSkeleton from "@/components/home-dashboard/DashboardSkeleton";
import type { HomeData } from "./page";

/**
 * Decides between the public homepage (guests / SEO HTML) and the logged-in
 * dashboard. The route stays ISR: the server always renders the guest version,
 * and token holders swap to the dashboard client-side after hydration.
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

export default function HomeGate({ initialData }: { initialData: HomeData }) {
    const hasToken = useSyncExternalStore(subscribeStorage, getTokenSnapshot, getServerSnapshot);
    const { user, isLoading } = useAuth();

    // Guests (no token): the public homepage, byte-identical to the SSR HTML.
    if (!hasToken) return <HomeClient initialData={initialData} />;

    // Token present, /auth/me still resolving: skeleton instead of a guest flash.
    if (isLoading) return <DashboardSkeleton />;

    // Stale/invalid token: fall back to the public homepage (no redirect loops).
    if (!user) return <HomeClient initialData={initialData} />;

    return <DashboardHome user={user} />;
}
