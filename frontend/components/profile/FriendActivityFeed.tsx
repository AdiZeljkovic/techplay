"use client";

import useSWR from "swr";
import Link from "next/link";
import axios from "@/lib/axios";
import { Gamepad2, Trophy, BookmarkPlus, CheckCircle2, Heart, Loader2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/timeAgo";

interface ActivityUser {
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface FriendActivity {
    type: string;
    user: ActivityUser;
    game_name?: string;
    game_slug?: string;
    achievement_name?: string;
    icon_path?: string;
    points?: number;
    source?: string;
    created_at: string;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? []);

function activityLabel(a: FriendActivity): { icon: React.ReactNode; text: string; link: string | null } {
    switch (a.type) {
        case "playing":
            return {
                icon: <Gamepad2 className="w-3.5 h-3.5 text-green-400" />,
                text: `is playing ${a.game_name}`,
                link: a.game_slug ? `/games/${a.game_slug}` : null,
            };
        case "collection_completed":
            return {
                icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
                text: `completed ${a.game_name}`,
                link: a.game_slug ? `/games/${a.game_slug}` : null,
            };
        case "collection_playing":
            return {
                icon: <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />,
                text: `started playing ${a.game_name}`,
                link: a.game_slug ? `/games/${a.game_slug}` : null,
            };
        case "collection_backlog":
            return {
                icon: <BookmarkPlus className="w-3.5 h-3.5 text-white/40" />,
                text: `added ${a.game_name} to backlog`,
                link: a.game_slug ? `/games/${a.game_slug}` : null,
            };
        case "collection_wishlist":
            return {
                icon: <Heart className="w-3.5 h-3.5 text-pink-400" />,
                text: `wishlisted ${a.game_name}`,
                link: a.game_slug ? `/games/${a.game_slug}` : null,
            };
        case "achievement":
            return {
                icon: <Trophy className="w-3.5 h-3.5 text-yellow-400" />,
                text: `unlocked "${a.achievement_name}"`,
                link: null,
            };
        default:
            return { icon: null, text: a.type, link: null };
    }
}

export default function FriendActivityFeed() {
    const { data, isLoading } = useSWR<FriendActivity[]>("/friends/activity", fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <EmptyState
                variant="compact"
                title="No friend activity yet"
                body="Add friends to see what they're playing, live."
                action={{ label: "Find friends", href: "/friends" }}
            />
        );
    }

    return (
        <div className="space-y-1">
            {data.map((activity, i) => {
                const { icon, text, link } = activityLabel(activity);
                const name = activity.user.display_name || activity.user.username;
                const isLive = activity.type === "playing";

                const content = (
                    <div className={`flex items-start gap-3 px-3.5 py-3 rounded-[var(--radius-card)] border transition-colors duration-300 ${isLive ? "bg-emerald-500/[0.05] border-emerald-500/15" : "border-transparent hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[var(--fill-1)]"}`}>
                        <Link href={`/profile/${activity.user.username}`} onClick={(e) => e.stopPropagation()}>
                            <Avatar src={activity.user.avatar_url} alt={activity.user.display_name || activity.user.username} size="sm" />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Link href={`/profile/${activity.user.username}`} className="text-[12px] font-bold text-white hover:text-[var(--accent)] transition-colors">
                                    {name}
                                </Link>
                                {icon}
                                <span className="text-[12px] text-white/45 truncate">{text}</span>
                                {isLive && (
                                    <span className="ml-1 inline-flex items-center h-[15px] px-1.5 rounded-[3px] bg-emerald-500/15 border border-emerald-500/30 font-display text-[8px] font-black uppercase tracking-[0.14em] text-emerald-400">
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/25 mt-1">
                                {timeAgo(activity.created_at)}
                            </div>
                        </div>
                    </div>
                );

                return link ? (
                    <Link key={i} href={link}>{content}</Link>
                ) : (
                    <div key={i}>{content}</div>
                );
            })}
        </div>
    );
}
