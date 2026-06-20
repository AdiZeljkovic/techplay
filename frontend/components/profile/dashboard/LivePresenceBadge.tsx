"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import { Gamepad2, Radio } from "lucide-react";

interface Presence {
    game_name: string;
    game_slug: string | null;
    source: string;
    started_at: string;
}

interface Props {
    username: string;
    userId: number;
}

export default function LivePresenceBadge({ username, userId }: Props) {
    const [presence, setPresence] = useState<Presence | null | undefined>(undefined);

    useEffect(() => {
        axios.get(`/presence/${username}`)
            .then((r) => setPresence(r.data?.data ?? null))
            .catch(() => setPresence(null));
    }, [username]);

    // Subscribe to Reverb for real-time updates
    useEffect(() => {
        const win = window as any;
        if (!win.Echo) return;

        const channel = win.Echo.channel(`presence.${userId}`);
        channel.listen(".presence.updated", (e: any) => {
            if (e.is_active && e.game_name) {
                setPresence({
                    game_name: e.game_name,
                    game_slug: e.game_slug,
                    source: e.source,
                    started_at: e.started_at,
                });
            } else {
                setPresence(null);
            }
        });

        return () => {
            win.Echo.leaveChannel(`presence.${userId}`);
        };
    }, [userId]);

    if (presence === undefined) return null; // still loading
    if (!presence) return null;             // not playing

    const inner = (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0B0E14] border border-green-500/20 hover:border-green-500/40 transition-colors">
            <div className="relative shrink-0">
                <Gamepad2 className="w-5 h-5 text-green-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-1">
                        <Radio className="w-3 h-3" /> Live
                    </span>
                    <span className="text-[10px] text-white/30 capitalize">{presence.source}</span>
                </div>
                <div className="text-[13px] font-semibold text-white truncate">{presence.game_name}</div>
            </div>
        </div>
    );

    return presence.game_slug
        ? <Link href={`/games/${presence.game_slug}`}>{inner}</Link>
        : inner;
}
