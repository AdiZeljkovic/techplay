"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { FriendOnline } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";

/** Who's in a game right now — presence is the pulse of the sidebar. */
export default function FriendsOnlineWidget({ friends }: { friends: FriendOnline[] }) {
    return (
        <Panel
            title={friends.length > 0 ? `Squad Online — ${friends.length}` : "Squad Online"}
            icon={<Users className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "All friends", href: "/friends" }}
            bodyClassName="p-3"
        >
            {friends.length === 0 ? (
                <EmptyState
                    variant="compact"
                    title="No one's in a game right now"
                    body="Add friends to see what they're playing, live."
                    action={{ label: "Find friends", href: "/friends" }}
                />
            ) : (
                <div className="flex flex-col gap-0.5">
                    {friends.map((f) => (
                        <Link
                            key={f.username}
                            href={`/profile/${f.username}`}
                            className="group flex items-center gap-3 p-2 rounded-[var(--radius-card)] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                        >
                            <span className="relative shrink-0">
                                <Avatar src={f.avatar_url} alt={f.display_name ?? f.username} size="sm" />
                                <span
                                    aria-hidden
                                    className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-emerald-500 border-2 border-[var(--surface-1)]"
                                />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors duration-150">
                                    {f.display_name ?? f.username}
                                </span>
                                {f.game_name && (
                                    <span className="mt-0.5 flex items-center gap-1.5 min-w-0">
                                        <span className="inline-flex items-center h-[14px] px-1 rounded-[3px] bg-emerald-500/15 border border-emerald-500/30 font-display text-[7.5px] font-black uppercase tracking-[0.12em] text-emerald-400 shrink-0">
                                            Live
                                        </span>
                                        <span className="text-[10px] text-white/45 truncate">{f.game_name}</span>
                                    </span>
                                )}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </Panel>
    );
}
