"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Zap, Star, Library, CheckCircle2, Crown, Medal, Award, Loader2 } from "lucide-react";

type BoardType = "xp" | "reputation" | "collection" | "completions";

interface LeaderboardEntry {
    position: number;
    username: string;
    name: string;
    avatar_url: string | null;
    rank_title: string | null;
    value: number;
    label: string;
}

const BOARDS: { id: BoardType; label: string; icon: typeof Zap; description: string; valueFormat: (v: number) => string }[] = [
    {
        id: "xp",
        label: "XP / Level",
        icon: Zap,
        description: "Top players by total experience points",
        valueFormat: (v) => v.toLocaleString() + " XP",
    },
    {
        id: "reputation",
        label: "Reputation",
        icon: Star,
        description: "Most reputable community members",
        valueFormat: (v) => v.toLocaleString() + " REP",
    },
    {
        id: "collection",
        label: "Collection",
        icon: Library,
        description: "Biggest game libraries",
        valueFormat: (v) => v.toLocaleString() + " Games",
    },
    {
        id: "completions",
        label: "Completions",
        icon: CheckCircle2,
        description: "Most games completed",
        valueFormat: (v) => v.toLocaleString() + " Completed",
    },
];

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? []);

function positionIcon(pos: number) {
    if (pos === 1) return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" />;
    if (pos === 2) return <Medal className="w-4 h-4 text-slate-300" />;
    if (pos === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return null;
}

function positionColor(pos: number): string {
    if (pos === 1) return "text-yellow-400 font-black";
    if (pos === 2) return "text-slate-300 font-bold";
    if (pos === 3) return "text-amber-600 font-bold";
    return "text-white/30 font-bold";
}

function rowGlow(pos: number): string {
    if (pos === 1) return "border-yellow-400/20 bg-yellow-400/[0.04]";
    if (pos === 2) return "border-slate-400/15 bg-white/[0.025]";
    if (pos === 3) return "border-amber-700/20 bg-amber-900/[0.04]";
    return "border-white/[0.05] bg-transparent";
}

export default function LeaderboardPage() {
    const [active, setActive] = useState<BoardType>("xp");
    const [period, setPeriod] = useState<"all" | "week">("all");
    const board = BOARDS.find((b) => b.id === active)!;
    const weeklySupported = active === "xp" || active === "reputation";
    const effectivePeriod = weeklySupported ? period : "all";

    const { data: entries = [], isLoading } = useSWR<LeaderboardEntry[]>(
        `/leaderboard?type=${active}&period=${effectivePeriod}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    return (
        <div className="min-h-screen pt-24 pb-20 bg-[var(--bg-primary)]">
            <div className="max-w-[900px] mx-auto px-4 xl:px-0">

                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-4">
                        <Trophy className="w-7 h-7 text-[var(--accent)]" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">Leaderboard</h1>
                    <p className="text-[14px] text-white/40">{board.description}</p>
                </div>

                {/* Board selector tabs */}
                <div className="flex gap-2 mb-8 flex-wrap justify-center">
                    {BOARDS.map((b) => {
                        const Icon = b.icon;
                        const isActive = b.id === active;
                        return (
                            <button key={b.id} onClick={() => setActive(b.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                    isActive
                                        ? "bg-[var(--accent)] text-white shadow-[0_0_20px_rgba(252,65,0,0.25)]"
                                        : "bg-white/[0.04] text-white/50 border border-white/[0.07] hover:text-white hover:bg-white/[0.08]"
                                }`}>
                                <Icon className="w-4 h-4" />
                                {b.label}
                            </button>
                        );
                    })}
                </div>

                {/* Period toggle — weekly cut for the score boards */}
                {weeklySupported && (
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
                            {([["all", "All Time"], ["week", "This Week"]] as const).map(([id, label]) => (
                                <button key={id} onClick={() => setPeriod(id)}
                                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                        period === id ? "bg-[var(--accent)] text-white" : "text-white/40 hover:text-white"
                                    }`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className="rounded-2xl bg-[#0B0E14] border border-white/[0.07] overflow-hidden">
                    {/* Column headers */}
                    <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-white/25">
                        <span className="w-10 text-center">#</span>
                        <span className="flex-1">Player</span>
                        <span>{board.label}</span>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 text-white/25">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-16 text-white/30 text-[14px]">
                            {effectivePeriod === "week" ? "No activity yet this week — be the first!" : "No data yet"}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {entries.map((entry) => (
                                <Link key={entry.username} href={`/profile/${entry.username}`}
                                    className={`flex items-center gap-4 px-6 py-3.5 border-l-2 hover:bg-white/[0.03] transition-colors group ${rowGlow(entry.position)}`}>

                                    {/* Position */}
                                    <div className="w-10 flex items-center justify-center gap-1 shrink-0">
                                        {positionIcon(entry.position) ?? (
                                            <span className={`text-[13px] tabular-nums ${positionColor(entry.position)}`}>
                                                {entry.position}
                                            </span>
                                        )}
                                        {entry.position <= 3 && (
                                            <span className={`text-[11px] tabular-nums ${positionColor(entry.position)}`}>
                                                {entry.position}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/[0.06] border border-white/[0.08] shrink-0 flex items-center justify-center text-white/30 text-[11px] font-bold">
                                        {entry.avatar_url ? (
                                            <Image src={entry.avatar_url} alt={entry.name} width={36} height={36} className="object-cover w-full h-full" />
                                        ) : (
                                            entry.name.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    {/* Name + rank */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[14px] font-bold text-white group-hover:text-[var(--accent)] transition-colors truncate">
                                            {entry.name}
                                        </div>
                                        {entry.rank_title && (
                                            <div className="text-[11px] text-white/35 truncate">{entry.rank_title}</div>
                                        )}
                                        {!entry.rank_title && (
                                            <div className="text-[11px] text-white/30 truncate">@{entry.username}</div>
                                        )}
                                    </div>

                                    {/* Value */}
                                    <div className={`text-[14px] font-black tabular-nums shrink-0 ${entry.position <= 3 ? "text-[var(--accent)]" : "text-white/70"}`}>
                                        {board.valueFormat(entry.value)}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-center text-[11px] text-white/20 mt-6">
                    Updated every 5 minutes · Top 50 players
                </p>
            </div>
        </div>
    );
}
