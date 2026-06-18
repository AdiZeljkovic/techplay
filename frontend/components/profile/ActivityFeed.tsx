"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MessageCircle, Trophy, Gamepad2, ListChecks, Gift, Sparkles, Activity as ActivityIcon, Heart, CalendarClock } from "lucide-react";
import type { ActivityItem } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const TYPE_META: Record<string, { icon: any; color: string }> = {
    thread: { icon: MessageSquare, color: "#FC4100" },
    comment: { icon: MessageCircle, color: "#60a5fa" },
    achievement: { icon: Trophy, color: "#facc15" },
    game: { icon: Gamepad2, color: "#34d399" },
    list: { icon: ListChecks, color: "#a78bfa" },
    reward: { icon: Gift, color: "#fbbf24" },
    customization: { icon: Sparkles, color: "#a855f7" },
    wishlist: { icon: Heart, color: "#a855f7" },
    track: { icon: CalendarClock, color: "#60a5fa" },
};

const FILTERS = [
    { id: "all", label: "All" },
    { id: "forum", label: "Forum" },
    { id: "games", label: "Games" },
    { id: "achievements", label: "Achievements" },
    { id: "rewards", label: "Rewards" },
];

interface Props {
    username: string;
    /** Compact = overview preview (no filters, Load More instead of pagination). */
    compact?: boolean;
}

export default function ActivityFeed({ username, compact }: Props) {
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(6); // compact: grows via "Load More"

    const perPage = compact ? limit : 15;
    const query = `category=${filter === "all" ? "" : filter}&page=${compact ? 1 : page}&per_page=${perPage}`;
    const { data, isLoading } = useSWR<{ data: { items: ActivityItem[]; total: number; page: number; last_page: number } }>(
        `/users/${username}/activity?${query}`,
        fetcher,
    );

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;
    const lastPage = data?.data?.last_page ?? 1;

    return (
        <div>
            {!compact && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-5">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => { setFilter(f.id); setPage(1); }}
                            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${filter === f.id ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white/75 border border-white/[0.06]"}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {isLoading && items.length === 0 ? (
                <div className="space-y-2">
                    {Array.from({ length: compact ? 5 : 8 }).map((_, i) => <div key={i} className="h-11 bg-white/[0.04] rounded-lg animate-pulse" />)}
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-white/30">
                    <ActivityIcon className="w-7 h-7 mb-2" />
                    <span className="text-[13px]">No activity yet</span>
                </div>
            ) : (
                <div className="relative pl-6">
                    {/* timeline line */}
                    <div className="absolute left-[6px] top-3 bottom-3 w-px bg-white/[0.08]" />
                    <div className="space-y-1">
                        {items.map((it, i) => {
                            const meta = TYPE_META[it.type] ?? { icon: ActivityIcon, color: "#9ca3af" };
                            const Icon = meta.icon;
                            const body = (
                                <div className="relative flex items-center gap-3 rounded-lg hover:bg-white/[0.03] px-2 py-2.5 transition-colors">
                                    {/* orange ring dot on the line */}
                                    <span className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full border-2 border-[var(--accent)] bg-[var(--bg-card)]" />
                                    <span className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                                    </span>
                                    <span className="flex-1 min-w-0 text-[13px] text-white/75 truncate">{it.title}</span>
                                    {it.created_at && <span className="text-[10px] text-white/30 shrink-0">{formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}</span>}
                                </div>
                            );
                            return it.url ? <Link key={i} href={it.url} className="block">{body}</Link> : <div key={i}>{body}</div>;
                        })}
                    </div>
                </div>
            )}

            {/* Compact: Load More */}
            {compact && items.length > 0 && items.length < total && (
                <div className="flex justify-center mt-4">
                    <button onClick={() => setLimit((l) => l + 6)} className="px-6 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 text-[11px] font-bold uppercase tracking-wider transition-colors">
                        Load More Activity
                    </button>
                </div>
            )}

            {/* Full: pagination */}
            {!compact && lastPage > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg bg-white/[0.05] disabled:opacity-30 text-white/70 text-[11px] font-bold uppercase tracking-wider">Prev</button>
                    <span className="text-[11px] text-white/40 tabular-nums">{page} / {lastPage}</span>
                    <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="px-3 py-1.5 rounded-lg bg-white/[0.05] disabled:opacity-30 text-white/70 text-[11px] font-bold uppercase tracking-wider">Next</button>
                </div>
            )}
        </div>
    );
}
