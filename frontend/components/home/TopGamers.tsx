"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

interface Entry {
    position: number;
    username: string;
    name: string;
    avatar_url: string | null;
    value: number;
    label: string;
}

const medal = ["text-amber-400", "text-zinc-300", "text-amber-700"];

/**
 * Homepage bridge to the gamer platform: top 5 XP earners this week
 * (falls back to the all-time board while a week is still quiet).
 */
export default function TopGamers() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [weekly, setWeekly] = useState(true);

    useEffect(() => {
        const base = `${process.env.NEXT_PUBLIC_API_URL}/leaderboard?type=xp`;
        fetch(`${base}&period=week`)
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                const data: Entry[] = json?.data ?? [];
                if (data.length >= 3) {
                    setEntries(data.slice(0, 5));
                    return null;
                }
                return fetch(base).then((r) => (r.ok ? r.json() : null));
            })
            .then((json) => {
                if (!json) return;
                const data: Entry[] = json?.data ?? [];
                if (data.length > 0) {
                    setWeekly(false);
                    setEntries(data.slice(0, 5));
                }
            })
            .catch(() => {});
    }, []);

    if (entries.length === 0) return null;

    return (
        <aside className="w-full flex flex-col bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300 mt-8">
            <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#FC4100]/20 dark:via-[#FC4100]/40 to-transparent" />
            <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-[#FC4100]/10 blur-[80px] rounded-full pointer-events-none" />

            <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-6 relative z-10">
                {weekly ? "TOP GAMERS THIS WEEK" : "TOP GAMERS"}
            </h2>

            <div className="flex flex-col w-full px-1 relative z-10">
                {entries.map((e, i) => (
                    <Link
                        key={e.username}
                        href={`/profile/${e.username}`}
                        className={`group flex items-center gap-4 py-3 ${i !== entries.length - 1 ? "border-b border-zinc-200 dark:border-white/[0.04]" : ""}`}
                    >
                        <span className={`w-5 text-[14px] font-black tabular-nums ${medal[i] ?? "text-zinc-400 dark:text-white/30"}`}>
                            {e.position}
                        </span>
                        <span className="w-9 h-9 rounded-full overflow-hidden bg-white dark:bg-[#1A1F26] border border-zinc-200 dark:border-white/5 flex items-center justify-center shrink-0">
                            {e.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={e.avatar_url} alt={e.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[13px] font-black text-[#FC4100]">{e.name.charAt(0).toUpperCase()}</span>
                            )}
                        </span>
                        <span className="flex-1 min-w-0 text-[14px] font-semibold text-zinc-800 dark:text-[#E4E4E5] truncate group-hover:text-tp-accent transition-colors">
                            {e.name}
                        </span>
                        <span className="text-[12px] font-bold text-zinc-500 dark:text-[#A1A1AA] tabular-nums shrink-0">
                            {e.value.toLocaleString("en-US")} <span className="text-[10px] uppercase">XP</span>
                        </span>
                    </Link>
                ))}
            </div>

            <Link
                href="/leaderboard"
                className="mt-6 shrink-0 flex items-center justify-center gap-2 bg-white dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] relative z-10"
            >
                <Trophy className="w-4 h-4 text-[#FC4100]" /> FULL LEADERBOARD
            </Link>
        </aside>
    );
}
