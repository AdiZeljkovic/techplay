"use client";

import Link from "next/link";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, Gamepad2, Play, ListChecks, Tag, MessagesSquare, Rocket, Sparkles } from "lucide-react";
import type { ProfileStats } from "@/lib/types/profile";

interface Props {
    stats: ProfileStats;
    listsCount: number;
    hasGamertags: boolean;
    steamConnected: boolean;
    onOpenTab: (tab: string) => void;
}

async function startSteamConnect() {
    try {
        const res = await axios.get("/connected-accounts/steam/connect");
        const url = res.data?.data?.url;
        if (url) { window.location.href = url; return; }
        toast.error("Couldn't start the Steam connection.");
    } catch {
        toast.error("Couldn't start the Steam connection.");
    }
}

/**
 * Own-profile onboarding card: one checklist instead of a page full of
 * empty-state cards. Each item is a CTA; the card disappears once complete.
 */
export default function ProfileChecklist({ stats, listsCount, hasGamertags, steamConnected, onOpenTab }: Props) {
    const items = [
        {
            key: "steam",
            label: "Connect Steam — import your library in 30s",
            done: steamConnected,
            icon: Sparkles,
            onClick: startSteamConnect,
        },
        {
            key: "game",
            label: "Add your first game",
            done: (stats.games_count ?? 0) > 0,
            icon: Gamepad2,
            href: "/games",
        },
        {
            key: "playing",
            label: "Mark a game as Playing",
            done: (stats.playing_count ?? 0) > 0,
            icon: Play,
            onClick: () => onOpenTab("collection"),
        },
        {
            key: "list",
            label: "Create a game list",
            done: listsCount > 0,
            icon: ListChecks,
            onClick: () => onOpenTab("lists"),
        },
        {
            key: "gamertags",
            label: "Set your gamertags",
            done: hasGamertags,
            icon: Tag,
            href: "/settings",
        },
        {
            key: "forum",
            label: "Join a forum discussion",
            done: (stats.posts_count ?? 0) > 0 || (stats.threads_count ?? 0) > 0,
            icon: MessagesSquare,
            href: "/forum",
        },
    ];

    const doneCount = items.filter((i) => i.done).length;
    if (doneCount === items.length) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--accent)]/25 p-5">
            <span className="absolute -top-12 -right-12 w-36 h-36 bg-[var(--accent)]/[0.08] blur-[50px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-white">
                    <Rocket className="w-4 h-4 text-[var(--accent)]" />
                    Level up your profile
                </h3>
                <span className="text-[11px] font-black text-[var(--accent)] tabular-nums">{doneCount}/{items.length}</span>
            </div>

            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-700"
                    style={{ width: `${(doneCount / items.length) * 100}%` }} />
            </div>

            <div className="space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    const inner = (
                        <>
                            {item.done
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                : <Circle className="w-4 h-4 text-white/20 shrink-0" />}
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${item.done ? "text-white/25" : "text-[var(--accent)]"}`} />
                            <span className={`text-[12.5px] font-semibold ${item.done ? "text-white/30 line-through" : "text-white/75"}`}>
                                {item.label}
                            </span>
                        </>
                    );
                    const cls = `flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-colors text-left ${
                        item.done ? "cursor-default" : "hover:bg-white/[0.04]"
                    }`;

                    if (item.done) return <div key={item.key} className={cls}>{inner}</div>;
                    return item.href ? (
                        <Link key={item.key} href={item.href} className={cls}>{inner}</Link>
                    ) : (
                        <button key={item.key} onClick={item.onClick} className={cls}>{inner}</button>
                    );
                })}
            </div>
        </div>
    );
}
