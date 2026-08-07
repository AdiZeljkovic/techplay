"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import { getCategoryColor, getCategoryIcon, getAvatarSrc } from "@/lib/forum";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ActiveThread {
    id: number;
    title: string;
    slug: string;
    posts_count: number;
    updated_at: string;
    author: { username: string; avatar_url?: string };
    category?: { name: string; slug: string };
}

interface LeaderboardEntry {
    position: number;
    username: string;
    name: string;
    avatar_url?: string;
    value: number;
    label: string;
}

/** The quiet button under a sidebar list — command shape, no accent fill. */
const QUIET_ACTION =
    "btn-command btn-command-quiet mt-4 flex items-center justify-center gap-2 h-9 bg-white/[0.04] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors";

export default function ForumSidebar() {
    const { user } = useAuth();

    const { data: leaderboardResponse } = useSWR("/leaderboard?type=reputation", fetcher);
    const topContributors: LeaderboardEntry[] = leaderboardResponse?.data?.entries?.slice(0, 5) ?? [];

    const { data: activeThreads } = useSWR<ActiveThread[]>("/forum/active", fetcher);

    const avatarSrc = getAvatarSrc(user?.avatar_url);
    const xp = user?.xp ?? 0;
    const level = user?.level ?? 1;
    const nextRankXp = user?.next_rank?.min_xp ?? xp + 1000;
    const xpProgress = Math.min(100, Math.round((xp / Math.max(1, nextRankXp)) * 100));

    return (
        <div className="space-y-4 sticky top-[96px]">
            {/* ── who you are here ── */}
            {user ? (
                <Panel>
                    <div className="flex items-center gap-3">
                        <span className="relative w-14 h-14 shrink-0">
                            <span className="block w-14 h-14 rounded-full overflow-hidden ring-2 ring-[color-mix(in_srgb,var(--accent)_40%,transparent)]">
                                {avatarSrc ? (
                                    <Image src={avatarSrc} alt={user.username} width={56} height={56} className="object-cover w-full h-full" />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center bg-[var(--accent)] font-display text-[18px] font-black text-white">
                                        {user.username?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                )}
                            </span>
                            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--accent)] border-2 border-[var(--surface-1)] flex items-center justify-center font-display text-[10px] font-black tabular-nums text-white">
                                {level}
                            </span>
                        </span>
                        <div className="min-w-0">
                            <p className="font-display text-[14px] font-black text-white truncate">{user.username}</p>
                            {user.rank?.name && (
                                <p
                                    className="mt-0.5 font-display text-[9.5px] font-black uppercase tracking-[0.14em] truncate"
                                    style={{ color: user.rank.color || "var(--accent)" }}
                                >
                                    {user.rank.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <span className="font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/30">
                            Level {level} XP
                        </span>
                        <span className="font-display text-[10px] font-black tabular-nums text-white/45">
                            {xp.toLocaleString()} / {nextRankXp.toLocaleString()}
                        </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--xp)] to-[var(--xp-bright)]"
                            style={{ width: `${xpProgress}%` }}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {([
                            ["Posts", user.posts_count || 0],
                            ["Rep", user.forum_reputation || 0],
                        ] as const).map(([label, value]) => (
                            <span key={label} className="text-center rounded-[var(--radius-card)] bg-white/[0.03] py-2">
                                <span className="block font-display text-[16px] font-black tabular-nums text-white leading-none">{value}</span>
                                <span className="mt-1 block font-display text-[8px] font-bold uppercase tracking-[0.16em] text-white/30">{label}</span>
                            </span>
                        ))}
                    </div>

                    <Link
                        href={`/profile/${user.username}`}
                        className="btn-command mt-4 flex items-center justify-center h-9 bg-[var(--accent)] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white hover:brightness-110 transition-[filter]"
                    >
                        View profile
                    </Link>
                </Panel>
            ) : (
                <Panel>
                    <p className="font-display text-[14px] font-black text-white">Join the community</p>
                    <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                        Log in to post, earn XP, and climb the ranks.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <Link
                            href="/login"
                            className="btn-command flex-1 flex items-center justify-center h-9 bg-[var(--accent)] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white hover:brightness-110 transition-[filter]"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/register"
                            className="btn-command btn-command-quiet flex-1 flex items-center justify-center h-9 bg-white/[0.04] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                            Register
                        </Link>
                    </div>
                </Panel>
            )}

            {/* ── who carries the boards ── */}
            <Panel title="Top contributors">
                {topContributors.length === 0 ? (
                    <div className="space-y-2.5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-11 rounded-[var(--radius-card)] bg-white/[0.03] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.05] -my-1">
                        {topContributors.map((entry) => {
                            const src = getAvatarSrc(entry.avatar_url);
                            return (
                                <Link key={entry.username} href={`/profile/${entry.username}`} className="group flex items-center gap-3 py-2.5">
                                    <span className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-[var(--accent-soft)] flex items-center justify-center">
                                        {src ? (
                                            <Image src={src} alt={entry.username} width={36} height={36} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="font-display text-[13px] font-black text-[var(--accent)]">
                                                {entry.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-display text-[12.5px] font-black text-white truncate leading-tight group-hover:text-[var(--accent)] transition-colors">
                                            {entry.name || entry.username}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-white/25 tabular-nums">
                                            {entry.value.toLocaleString()} rep
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <Link href="/leaderboard" className={QUIET_ACTION}>
                    <Trophy className="w-3.5 h-3.5" /> View leaderboard
                </Link>
            </Panel>

            {/* ── what is being said right now ── */}
            <Panel title="Latest posts">
                {!activeThreads ? (
                    <div className="space-y-2.5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 rounded-[var(--radius-card)] bg-white/[0.03] animate-pulse" />
                        ))}
                    </div>
                ) : activeThreads.length === 0 ? (
                    <p className="text-[12px] text-white/25">No recent posts.</p>
                ) : (
                    <div className="divide-y divide-white/[0.05] -my-1">
                        {activeThreads.map((thread) => {
                            const catSlug = thread.category?.slug ?? "";
                            const color = getCategoryColor(catSlug);
                            const Icon = getCategoryIcon(catSlug);
                            return (
                                <Link key={thread.id} href={`/forum/thread/${thread.slug}`} className="group flex items-start gap-3 py-2.5">
                                    <span
                                        className="w-8 h-8 shrink-0 rounded-[var(--radius-card)] flex items-center justify-center mt-0.5"
                                        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display text-[12px] font-black text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                            {thread.title}
                                        </p>
                                        <p className="mt-0.5 text-[10.5px] text-white/25">
                                            {thread.category?.name ?? "Forum"}
                                            {" · "}
                                            <span suppressHydrationWarning>
                                                {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                            </span>
                                        </p>
                                    </div>
                                    <span className="shrink-0 flex items-center gap-1 mt-0.5 text-white/25">
                                        <MessageCircle className="w-3 h-3" />
                                        <span className="font-display text-[10px] font-black tabular-nums">{thread.posts_count}</span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <Link href="/forum" className={QUIET_ACTION}>
                    View all latest posts
                </Link>
            </Panel>
        </div>
    );
}
