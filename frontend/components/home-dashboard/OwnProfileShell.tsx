"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import type { DashboardData } from "@/lib/types/dashboard";
import ProfileHero from "./ProfileHero";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as DashboardData);

/**
 * The hero + tab strip for your own profile, without the Overview content.
 * Overview renders the whole DashboardHome; every other tab renders this
 * shell and then its own content, so the page keeps one identity band
 * instead of falling back to the legacy header.
 *
 * Shares the "/me/dashboard" SWR key, so it costs nothing once loaded.
 */
export default function OwnProfileShell({ activeTab }: { activeTab: string }) {
    const { data } = useSWR("/me/dashboard", fetcher, {
        dedupingInterval: 30_000,
        revalidateOnFocus: false,
    });

    if (!data) {
        return <div className="h-[298px] rounded-[var(--radius-panel)] bg-[var(--fill-2)] animate-pulse" />;
    }

    return <ProfileHero data={data} activeTab={activeTab} />;
}
