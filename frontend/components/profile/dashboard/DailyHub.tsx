"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { Coins, Target, ChevronRight, Radio, X, Loader2, Gem, Rocket } from "lucide-react";
import SeasonBanner from "@/components/ui/SeasonBanner";
import DailyStreakWidget from "./DailyStreakWidget";
import QuestPanel from "./QuestPanel";

interface Props {
    bounty: number;
    username?: string;
    onOpenTab: (tab: string) => void;
}

const searchFetcher = (url: string) => axios.get(url).then((r) => r.data);

/** Inline "Now Playing" picker — POST /presence with a manually chosen game. */
function NowPlayingPicker() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query), 350);
        return () => clearTimeout(t);
    }, [query]);

    const { data } = useSWR<{ results: { id: number; slug: string; name: string }[] }>(
        open && debounced.length >= 2 ? `/games?search=${encodeURIComponent(debounced)}&page_size=6` : null,
        searchFetcher,
        { keepPreviousData: true }
    );

    const setPlaying = async (name: string) => {
        setBusy(true);
        try {
            await axios.post("/presence", { game_name: name });
            toast.success(`Now playing: ${name}`);
            setOpen(false);
            setQuery("");
            globalMutate((key) => typeof key === "string" && key.startsWith("/presence/"));
        } catch {
            toast.error("Couldn't set presence.");
        } finally {
            setBusy(false);
        }
    };

    const clearPlaying = async () => {
        setBusy(true);
        try {
            await axios.delete("/presence");
            toast.success("Presence cleared");
            setOpen(false);
            globalMutate((key) => typeof key === "string" && key.startsWith("/presence/"));
        } catch {
            toast.error("Couldn't clear presence.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-card)] border border-[var(--line)] bg-white/[0.02] hover:border-[var(--accent)]/30 transition-all text-left"
            >
                <span className="flex items-center gap-2 text-[12px] font-bold text-white/70">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Set &quot;Now Playing&quot;
                </span>
                {open ? <X className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
            </button>

            {open && (
                <div className="mt-2 space-y-1.5">
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What are you playing?"
                        className="w-full bg-white/[0.03] border border-[var(--line)] rounded-[var(--radius-card)] px-3 py-2 text-[12.5px] text-white placeholder:text-white/25 focus:outline-none focus:border-[var(--accent)]/50"
                    />
                    {(data?.results ?? []).map((g) => (
                        <button key={g.id} onClick={() => setPlaying(g.name)} disabled={busy}
                            className="w-full text-left px-3 py-1.5 rounded-[var(--radius-card)] text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors truncate">
                            {busy ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}{g.name}
                        </button>
                    ))}
                    <button onClick={clearPlaying} disabled={busy}
                        className="w-full text-left px-3 py-1.5 rounded-[var(--radius-card)] text-[11px] font-bold uppercase tracking-wider text-white/30 hover:text-red-400 transition-colors">
                        Clear presence
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * The owner's daily engagement hub: bounty wallet, active season,
 * daily streak claim and quests — one card instead of four.
 */
export default function DailyHub({ bounty, username, onOpenTab }: Props) {
    return (
        <div className="rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] overflow-hidden">
            {/* Wallet row */}
            <button
                onClick={() => onOpenTab("rewards")}
                className="group w-full flex items-center justify-between px-5 py-4 border-b border-[var(--line)] hover:bg-white/[0.02] transition-colors"
            >
                <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-[var(--radius-card)] bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-amber-400" />
                    </span>
                    <span className="text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Bounty</span>
                        <span className="block text-[17px] font-black text-white tabular-nums leading-tight">{bounty.toLocaleString("en-US")}</span>
                    </span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/35 group-hover:text-[var(--accent)] transition-colors">
                    Rewards <ChevronRight className="w-3.5 h-3.5" />
                </span>
            </button>

            <div className="p-4 space-y-4">
                <SeasonBanner />
                <DailyStreakWidget />
                <NowPlayingPicker />
                <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 mb-3">
                        <Target className="w-3.5 h-3.5 text-[var(--accent)]" /> Active Quests
                    </h4>
                    <QuestPanel isOwnProfile compact />
                </div>

                {/* Discovery shortcuts — the profile's hidden gems */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link href={username ? `/wrapped/${username}` : "/wrapped"}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-card)] border border-[var(--line)] bg-white/[0.02] hover:border-[var(--accent)]/30 transition-all text-[11px] font-bold text-white/70 hover:text-white">
                        <Gem className="w-3.5 h-3.5 text-[var(--accent)]" /> Wrapped
                    </Link>
                    <Link href="/backlog-advisor"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-card)] border border-[var(--line)] bg-white/[0.02] hover:border-[var(--accent)]/30 transition-all text-[11px] font-bold text-white/70 hover:text-white">
                        <Rocket className="w-3.5 h-3.5 text-[var(--accent)]" /> Backlog AI
                    </Link>
                </div>
            </div>
        </div>
    );
}
