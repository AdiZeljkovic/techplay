"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { Target, ChevronRight, Radio, X, Loader2, Gem, Rocket } from "lucide-react";
import SeasonBanner from "@/components/ui/SeasonBanner";
import Readout from "@/components/ui/Readout";
import StatIcon from "@/components/home-dashboard/StatIcon";
import DailyStreakWidget from "./DailyStreakWidget";
import QuestPanel from "./QuestPanel";

interface Props {
    bounty: number;
    username?: string;
    onOpenTab: (tab: string) => void;
}

const searchFetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * Everything that shows a presence, refreshed at once.
 *
 * This used to invalidate keys beginning `/presence/` — a route nothing on the
 * site ever fetched, so the picker updated nothing at all. The two surfaces
 * that actually carry it are the profile payload and the owner's dashboard.
 */
function refreshPresence() {
    globalMutate(
        (key) => typeof key === "string" && (key === "/me/dashboard" || key.startsWith("/users/")),
    );
}

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
            refreshPresence();
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
            refreshPresence();
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
 * The owner's daily loop, in the order the day happens.
 *
 * It used to be six boxes with gaps between them and the wallet on top, which
 * put a balance — a state, not an action — above everything with a deadline.
 * The season frames the day, the streak expires tonight, the quests are the
 * work, and the wallet is what the work paid. That is the order now, with
 * seams instead of gaps so it reads as one instrument rather than a stack of
 * unrelated cards.
 *
 * The Daily Challenge card used to sit elsewhere on the page showing the most
 * urgent quest. That quest is the first row of the list below, so it was
 * always drawn twice; it is only here now.
 */
export default function DailyHub({ bounty, username, onOpenTab }: Props) {
    return (
        <div
            className="rounded-[var(--radius-panel)] border overflow-hidden"
            style={{
                background: "var(--surface-2)",
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.07]">
                <Target className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-display text-[11px] font-black uppercase tracking-[0.15em] text-white">Today</h3>
            </header>

            {/* The frame the day sits in. */}
            <div className="px-4 pt-4">
                <SeasonBanner />
            </div>

            {/* The one thing that expires tonight. */}
            <div className="px-4 pt-3">
                <DailyStreakWidget />
            </div>

            {/* The work, most urgent first. */}
            <div className="px-4 pt-4">
                <h4 className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-white/40">
                        Active quests
                    </span>
                    <button
                        onClick={() => onOpenTab("progression")}
                        className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/30 hover:text-[var(--accent-ink)] transition-colors"
                    >
                        All quests
                    </button>
                </h4>
                <QuestPanel isOwnProfile compact />
            </div>

            {/* What the work paid, and the door to spending it. A balance is a
                state rather than a thing to do, so it sits under the doing. */}
            <button
                onClick={() => onOpenTab("progression")}
                className="group mt-4 w-full flex items-end justify-between gap-4 px-5 py-4 border-y border-white/[0.07] bg-black/25 hover:bg-black/10 transition-colors text-left"
            >
                <span className="flex items-center gap-3.5 min-w-0">
                    {/* The struck token, the only gold object in the set —
                        currency should not read like every other number. */}
                    <StatIcon src="/images/profile/v2-bounty.webp" size={44} />
                    <Readout label="Bounty earned" value={bounty} unit="B" size="lg" animate tone="#fbbf24" />
                </span>
                <span className="flex items-center gap-1 pb-1.5 shrink-0 font-display text-[10px] font-bold uppercase tracking-widest text-white/35 group-hover:text-[var(--accent-ink)] transition-colors">
                    Spend it <ChevronRight className="w-3.5 h-3.5" />
                </span>
            </button>

            <div className="p-4 space-y-3">
                <NowPlayingPicker />

                <div className="grid grid-cols-2 gap-2">
                    <Link href={username ? `/wrapped/${username}` : "/wrapped"}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-card)] border border-[var(--line)] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors text-[11px] font-bold text-white/70 hover:text-white">
                        <Gem className="w-3.5 h-3.5 text-[var(--accent)]" /> Wrapped
                    </Link>
                    <Link href="/backlog-advisor"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-card)] border border-[var(--line)] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors text-[11px] font-bold text-white/70 hover:text-white">
                        <Rocket className="w-3.5 h-3.5 text-[var(--accent)]" /> Backlog AI
                    </Link>
                </div>
            </div>
        </div>
    );
}
