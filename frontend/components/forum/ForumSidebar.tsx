"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, MessageCircle, Award, Flame, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import { getCategoryIcon, getAvatarSrc } from "@/lib/forum";

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
    const rankColor = user?.rank?.color || "var(--accent)";

    return (
        <div className="space-y-4 sticky top-[96px]">
            {/* ── who you are here ── */}
            {user ? (
                /* The card is the reader's standing on the boards, so it is
                   built like a standing: the ring around the avatar is the
                   level bar itself rather than a separate strip, and the two
                   numbers underneath are the two that count here — what you
                   have written, and what the room made of it. */
                <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)]">
                    <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[74px] opacity-[0.16]"
                        style={{ background: `radial-gradient(120% 100% at 50% 0%, ${rankColor}, transparent 70%)` }}
                    />

                    <div className="relative p-4">
                        <div className="flex items-center gap-3.5">
                            <span className="relative w-16 h-16 shrink-0">
                                {/* conic ring = progress to the next level */}
                                <span
                                    className="absolute inset-0 rounded-full"
                                    style={{ background: `conic-gradient(var(--xp-bright) ${xpProgress}%, rgba(255,255,255,0.08) ${xpProgress}%)` }}
                                />
                                <span className="absolute inset-[3px] rounded-full overflow-hidden bg-[var(--surface-1)]">
                                    {avatarSrc ? (
                                        <Image src={avatarSrc} alt={user.username} width={64} height={64} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center bg-[var(--accent)] font-display text-[20px] font-black text-white">
                                            {user.username?.charAt(0)?.toUpperCase() || "?"}
                                        </span>
                                    )}
                                </span>
                                <span className="absolute -bottom-0.5 -right-0.5 min-w-[22px] h-[22px] px-1 rounded-full bg-[var(--xp-bright)] border-2 border-[var(--surface-1)] flex items-center justify-center font-display text-[10px] font-black tabular-nums text-white">
                                    {level}
                                </span>
                            </span>

                            <div className="min-w-0">
                                <p className="font-display text-[15px] font-black text-white truncate leading-tight">{user.username}</p>
                                {user.rank?.name && (
                                    <p
                                        className="mt-1 inline-flex items-center h-[19px] px-2 rounded-[5px] font-display text-[9px] font-black uppercase tracking-[0.14em]"
                                        style={{ color: rankColor, background: `color-mix(in srgb, ${rankColor} 14%, transparent)` }}
                                    >
                                        {user.rank.name}
                                    </p>
                                )}
                                <p className="mt-1.5 font-display text-[10px] font-bold tabular-nums text-white/35">
                                    {xp.toLocaleString()}
                                    <span className="text-white/20"> / {nextRankXp.toLocaleString()} XP</span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-1.5">
                            {([
                                [MessageCircle, "Posts", user.posts_count || 0],
                                [Award, "Rep", user.forum_reputation || 0],
                                [Flame, "Streak", user.daily_streak || 0],
                            ] as const).map(([Icon, label, value]) => (
                                <span key={label} className="rounded-[var(--radius-card)] bg-white/[0.03] py-2.5 text-center">
                                    <Icon className="w-3 h-3 mx-auto mb-1.5 text-white/25" />
                                    <span className="block font-display text-[15px] font-black tabular-nums text-white leading-none">{value}</span>
                                    <span className="mt-1 block font-display text-[7.5px] font-bold uppercase tracking-[0.16em] text-white/30">{label}</span>
                                </span>
                            ))}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Link
                                href="/forum/create"
                                className="btn-command flex items-center justify-center gap-1.5 h-9 bg-[var(--accent)] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white hover:brightness-110 transition-[filter]"
                            >
                                <Plus className="w-3.5 h-3.5" /> New thread
                            </Link>
                            <Link
                                href={`/profile/${user.username}`}
                                className="btn-command btn-command-quiet flex items-center justify-center h-9 bg-white/[0.04] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
                            >
                                Profile
                            </Link>
                        </div>
                    </div>
                </div>
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
                            const Icon = getCategoryIcon(catSlug);
                            return (
                                <Link key={thread.id} href={`/forum/thread/${thread.slug}`} className="group flex items-start gap-3 py-2.5">
                                    <span className="w-8 h-8 shrink-0 flex items-center justify-center mt-0.5">
                                        <Icon className="w-[21px] h-[21px]" />
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
