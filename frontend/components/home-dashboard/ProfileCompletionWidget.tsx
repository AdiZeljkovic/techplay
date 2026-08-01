"use client";

import Link from "next/link";
import useSWR from "swr";
import { UserCheck, Check, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import type { DashboardData, ProfileCompletion } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import RingMeter from "@/components/ui/RingMeter";

/** Shares the dashboard's SWR key, so this costs nothing where it's cached. */
const fetcher = (url: string) =>
    axios.get(url).then((r) => (r.data?.data as DashboardData)?.profile_completion);

/** Where each missing signal gets fixed. */
const ACTION_HREFS: Record<string, string> = {
    avatar: "/settings",
    cover: "/settings",
    bio: "/settings",
    location: "/settings",
    playstyle: "/settings",
    gamertags: "/settings",
    connect: "/settings",
    favorite: "/games",
    review: "/profile/me?tab=collection",
};

/**
 * Completion ring + the next steps that raise it. Lives in Settings, where
 * the steps can actually be acted on. Pass `completion` to render from data
 * you already hold; omit it and the widget fetches its own.
 */
export default function ProfileCompletionWidget({ completion: passed }: { completion?: ProfileCompletion }) {
    const { data: fetched } = useSWR(passed ? null : "/me/dashboard", fetcher, {
        revalidateOnFocus: false,
    });

    const completion = passed ?? fetched;

    if (!completion) {
        return (
            <Panel title="Profile Completion" icon={<UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />} bodyClassName="p-4">
                <div className="h-[64px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />
            </Panel>
        );
    }

    const done = completion.percent >= 100;

    return (
        <Panel
            title="Profile Completion"
            icon={<UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />}
            bodyClassName="p-4"
        >
            <div className="flex items-center gap-4">
                <RingMeter value={completion.percent} size={64} strokeWidth={5}>
                    <span className="font-display text-[15px] font-bold tabular-nums text-[var(--ink-hi)]">
                        {completion.percent}
                        <span className="text-[9px] text-[var(--ink-low)]">%</span>
                    </span>
                </RingMeter>

                <div className="min-w-0 flex-1">
                    {done ? (
                        <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ink-mid)]">
                            <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
                                <Check className="w-3 h-3 text-[var(--accent)]" strokeWidth={3} />
                            </span>
                            Profile complete — looking sharp.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {completion.missing.slice(0, 3).map((m) => (
                                <Link
                                    key={m.key}
                                    href={ACTION_HREFS[m.key] ?? "/settings"}
                                    className="group flex items-center justify-between gap-2 text-[12px] text-[var(--ink-low)] hover:text-[var(--ink-hi)] transition-colors duration-150"
                                >
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span aria-hidden className="w-1 h-1 rounded-full bg-[var(--ink-faint)] group-hover:bg-[var(--accent)] transition-colors duration-150" />
                                        <span className="truncate">{m.label}</span>
                                    </span>
                                    <ChevronRight className="w-3 h-3 shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all duration-300" />
                                </Link>
                            ))}
                            {completion.missing.length > 3 && (
                                <p className="text-[10px] text-[var(--ink-faint)]">
                                    +{completion.missing.length - 3} more to go
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Panel>
    );
}
