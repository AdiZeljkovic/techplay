"use client";

import Link from "next/link";
import useSWR from "swr";
import { MessagesSquare, Trophy, Star, Activity } from "lucide-react";
import axios from "@/lib/axios";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import { Article } from "@/types";

interface ActiveThread { id: number; title: string; slug: string; posts_count: number; }
interface LeaderEntry { position: number; username: string; name: string; avatar_url: string | null; value: number; }

const threadsFetcher = () =>
    axios.get("/forum/active", { params: { limit: 1 } }).then((r) => (r.data?.data ?? r.data ?? []) as ActiveThread[]);

const leaderFetcher = () =>
    axios.get("/leaderboard", { params: { type: "xp", period: "week" } }).then((r) => (r.data?.data ?? r.data ?? []) as LeaderEntry[]);

function PulseRow({ icon, kicker, title, sub, href }: { icon: React.ReactNode; kicker: string; title: string; sub?: string; href: string }) {
    return (
        <Link href={href} className="group flex items-start gap-3.5 p-3 -mx-1 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[var(--accent)]/40 transition-colors">
            <span className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">{icon}</span>
            <span className="flex-1 min-w-0">
                <span className="block text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">{kicker}</span>
                <span className="block mt-0.5 text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">{title}</span>
                {sub && <span className="block mt-0.5 text-[11px] text-white/40">{sub}</span>}
            </span>
        </Link>
    );
}

/** Live community signals: hottest thread, weekly top gamer, latest review. */
export default function CommunityPulse({ latestReview }: { latestReview?: Article }) {
    const { data: threads } = useSWR("pulse-threads", threadsFetcher, { dedupingInterval: 120_000, revalidateOnFocus: false });
    const { data: leaders } = useSWR("pulse-leaders", leaderFetcher, { dedupingInterval: 300_000, revalidateOnFocus: false });

    const thread = threads?.[0];
    const leader = leaders?.[0];

    return (
        <SectionCard
            title="Community Pulse"
            icon={<Activity className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "Join in", href: "/forum" }}
            bodyClassName="space-y-2.5"
        >
            {thread && (
                <PulseRow
                    icon={<MessagesSquare className="w-4.5 h-4.5 text-[var(--accent)]" />}
                    kicker="Trending discussion"
                    title={thread.title}
                    sub={`${thread.posts_count} replies`}
                    href={`/forum/thread/${thread.slug}`}
                />
            )}
            {latestReview && (
                <PulseRow
                    icon={<Star className="w-4.5 h-4.5 text-[var(--accent)]" />}
                    kicker="Latest review"
                    title={latestReview.title}
                    sub={latestReview.review_score ? `Scored ${Number(latestReview.review_score).toFixed(1)} / 10` : undefined}
                    href={`/reviews/${latestReview.slug}`}
                />
            )}
            {leader && (
                <PulseRow
                    icon={<Trophy className="w-4.5 h-4.5 text-[var(--accent)]" />}
                    kicker="Top gamer this week"
                    title={leader.name || leader.username}
                    sub={`${leader.value.toLocaleString()} XP earned`}
                    href={`/profile/${leader.username}`}
                />
            )}
            {!thread && !latestReview && !leader && (
                <p className="py-6 text-center text-[13px] text-white/35">The community is warming up…</p>
            )}
        </SectionCard>
    );
}
