"use client";

import Link from "next/link";
import { Users, MessageSquare } from "lucide-react";
import type { FriendOnline } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Your friends list, live status first. It shows everyone you've added, not
 * only whoever happens to be in a game — an account with friends should never
 * render an empty widget just because nobody is playing right now.
 */
export default function FriendsOnlineWidget({ friends }: { friends: FriendOnline[] }) {
    const online = friends.filter((f) => f.is_online).length;

    return (
        <Panel
            title="Friends"
            icon={<Users className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "All friends", href: "/friends" }}
            className="h-full flex flex-col"
            bodyClassName="p-3 flex-1 flex flex-col"
        >
            {friends.length === 0 ? (
                <EmptyState
                    variant="compact"
                    title="No friends yet"
                    body="Add friends to see what they're playing, live."
                    action={{ label: "Find friends", href: "/friends" }}
                />
            ) : (
                <>
                    {/* the headline: how many are actually around */}
                    <p className="px-2 pb-2.5 font-display text-[9.5px] font-bold uppercase tracking-[0.16em]">
                        <span className={online > 0 ? "text-emerald-400" : "text-white/45"}>{online} online</span>
                        <span className="text-white/20"> · {friends.length} total</span>
                    </p>

                    <div className="flex flex-col gap-0.5">
                        {friends.map((f) => (
                            <div
                                key={f.username}
                                className="group flex items-center gap-3 p-2 rounded-[10px] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                            >
                                <Link href={`/profile/${f.username}`} className="relative shrink-0">
                                    <span className={f.is_online ? "" : "opacity-55"}>
                                        <Avatar src={f.avatar_url} alt={f.display_name ?? f.username} size="sm" />
                                    </span>
                                    <span
                                        aria-hidden
                                        className={`absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2 border-[var(--surface-1)] ${
                                            f.is_online ? "bg-emerald-500" : "bg-white/25"
                                        }`}
                                    />
                                </Link>

                                <Link href={`/profile/${f.username}`} className="min-w-0 flex-1">
                                    <span
                                        className={`block text-[12px] font-semibold truncate group-hover:text-[var(--accent)] transition-colors duration-150 ${
                                            f.is_online ? "text-white" : "text-white/55"
                                        }`}
                                    >
                                        {f.display_name ?? f.username}
                                    </span>
                                    {f.is_online && f.game_name ? (
                                        <span className="mt-0.5 flex items-center gap-1.5 min-w-0">
                                            <span className="inline-flex items-center h-[14px] px-1 rounded-[3px] bg-emerald-500/15 border border-emerald-500/30 font-display text-[7.5px] font-black uppercase tracking-[0.12em] text-emerald-400 shrink-0">
                                                Live
                                            </span>
                                            <span className="text-[10px] text-white/45 truncate">{f.game_name}</span>
                                        </span>
                                    ) : (
                                        <span className="block mt-0.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">
                                            {f.is_online ? "Online" : "Offline"}
                                        </span>
                                    )}
                                </Link>

                                {/* messaging exists — reach it from here */}
                                <Link
                                    href="/messages"
                                    title={`Message ${f.display_name ?? f.username}`}
                                    className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-white/25 opacity-0 group-hover:opacity-100 hover:text-[var(--accent)] hover:bg-white/[0.06] transition-all duration-200"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Panel>
    );
}
