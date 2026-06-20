"use client";

import useSWR from "swr";
import Link from "next/link";
import axios from "@/lib/axios";
import { Gamepad2, Trophy, BookmarkPlus, CheckCircle2, Heart, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

function Avatar({ user }: { user: ActivityUser }) {
    return user.avatar_url ? (
        <img
            src={user.avatar_url}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
        />
    ) : (
        <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] font-bold text-[11px] shrink-0">
            {(user.display_name || user.username)[0].toUpperCase()}
        </div>
    );
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
            <div className="py-12 text-center">
                <Gamepad2 className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-[13px] text-white/30">No friend activity yet.</p>
                <p className="text-[11px] text-white/20 mt-1">Add friends to see what they&apos;re playing.</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {data.map((activity, i) => {
                const { icon, text, link } = activityLabel(activity);
                const name = activity.user.display_name || activity.user.username;
                const isLive = activity.type === "playing";

                const content = (
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-colors ${isLive ? "bg-green-500/5 border border-green-500/10" : "hover:bg-white/[0.03]"}`}>
                        <Link href={`/profile/${activity.user.username}`} onClick={(e) => e.stopPropagation()}>
                            <Avatar user={activity.user} />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Link href={`/profile/${activity.user.username}`} className="text-[12px] font-bold text-white hover:text-[var(--accent)] transition-colors">
                                    {name}
                                </Link>
                                {icon}
                                <span className="text-[12px] text-white/50 truncate">{text}</span>
                                {isLive && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400">
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-white/25 mt-0.5">
                                {activity.created_at
                                    ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
                                    : ""}
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
