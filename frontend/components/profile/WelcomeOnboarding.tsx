"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import { track } from "@/lib/track";
import toast from "react-hot-toast";
import { X, Search, Check, Loader2, Sparkles, Gamepad2, ArrowRight } from "lucide-react";

interface GameHit {
    id: number;
    slug: string;
    name: string;
    cover_url: string | null;
    released: string | null;
}

const DISMISS_KEY = "tp_welcome_dismissed";
const PICK_TARGET = 5;

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * First-60-seconds activation wizard. Shown on the owner's EMPTY profile
 * (or forced via ?welcome=1): connect Steam for an instant full profile,
 * or hand-pick favourite games. Dismissable; never shown again after.
 */
export default function WelcomeOnboarding({ username, forced, onClose }: {
    username: string;
    forced: boolean;
    onClose: () => void;
}) {
    const [mode, setMode] = useState<"choice" | "pick" | "xbox">("choice");
    const [connecting, setConnecting] = useState(false);
    const [xboxGamertag, setXboxGamertag] = useState("");
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [added, setAdded] = useState<string[]>([]);
    const [busySlug, setBusySlug] = useState<string | null>(null);

    useEffect(() => {
        track("wizard_shown");
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query), 350);
        return () => clearTimeout(t);
    }, [query]);

    const searchUrl = useMemo(
        () => (debounced.length >= 2 ? `/games?search=${encodeURIComponent(debounced)}&page_size=10` : null),
        [debounced]
    );
    const { data: results, isLoading: searching } = useSWR<{ results: GameHit[] }>(searchUrl, fetcher, { keepPreviousData: true });

    const dismiss = () => {
        track("wizard_skipped");
        try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
        onClose();
    };

    const connectSteam = async () => {
        track("wizard_steam_click");
        setConnecting(true);
        try {
            const res = await axios.get("/connected-accounts/steam/connect");
            const url = res.data?.data?.url;
            if (url) {
                try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
                window.location.href = url;
                return;
            }
            toast.error("Couldn't start the Steam connection.");
        } catch {
            toast.error("Couldn't start the Steam connection.");
        }
        setConnecting(false);
    };

    const connectXbox = async () => {
        if (xboxGamertag.trim().length < 2) {
            toast.error("Enter your Xbox gamertag first.");
            return;
        }
        setConnecting(true);
        try {
            const res = await axios.post("/connected-accounts/xbox/connect", { gamertag: xboxGamertag.trim() });
            track("wizard_xbox_submitted");
            try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
            toast.success(res.data?.message ?? "Xbox connected — importing your library!");
            globalMutate(`/users/${username}`);
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Couldn't find that gamertag.");
        } finally {
            setConnecting(false);
        }
    };

    const addGame = async (game: GameHit) => {
        if (added.includes(game.slug) || busySlug) return;
        setBusySlug(game.slug);
        try {
            await axios.put(`/collection/games/${game.slug}`, { status: "backlog", is_favorite: true });
            setAdded((prev) => [...prev, game.slug]);
        } catch {
            toast.error("Couldn't add that game.");
        } finally {
            setBusySlug(null);
        }
    };

    const finishPicking = () => {
        track("wizard_pick_done");
        try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
        globalMutate(`/users/${username}`);
        toast.success(`Added ${added.length} ${added.length === 1 ? "game" : "games"} to your collection!`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !forced) dismiss(); }}>
            <div className="relative w-full max-w-2xl rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] shadow-2xl overflow-hidden">
                <span className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-[var(--accent)]/80 via-[var(--accent)]/20 to-transparent" />

                <button onClick={dismiss} aria-label="Close"
                    className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                    <X className="w-4.5 h-4.5" />
                </button>

                {mode === "choice" ? (
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                            Welcome to TechPlay <span className="inline-block">👋</span>
                        </h2>
                        <p className="text-[14px] text-white/50 mb-8 max-w-md">
                            Let&apos;s build your gamer profile in under a minute. Pick your path:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Golden path: Steam */}
                            <button onClick={connectSteam} disabled={connecting}
                                className="group relative text-left rounded-[var(--radius-panel)] border border-[var(--accent)]/40 bg-[var(--accent)]/[0.06] hover:bg-[var(--accent)]/[0.12] p-6 transition-all overflow-hidden">
                                <span className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent)]/10 blur-[40px] rounded-full" />
                                <span className="inline-flex px-2 py-1 rounded-[var(--radius-inner)] bg-[var(--accent)] text-white text-[9px] font-black uppercase tracking-widest mb-4">
                                    Recommended
                                </span>
                                <h3 className="flex items-center gap-2 text-[16px] font-black text-white mb-1.5">
                                    {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[var(--accent)]" />}
                                    Connect Steam
                                </h3>
                                <p className="text-[12.5px] text-white/50 leading-relaxed">
                                    Import your entire library, playtime and achievements automatically. Full profile in ~30 seconds.
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                                    Connect <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>

                            {/* Xbox path */}
                            <button onClick={() => setMode("xbox")}
                                className="group text-left rounded-[var(--radius-panel)] border border-emerald-600/30 bg-emerald-600/[0.04] hover:bg-emerald-600/[0.09] p-6 transition-all">
                                <span className="inline-flex px-2 py-1 rounded-[var(--radius-inner)] bg-[#107C10] text-white text-[9px] font-black uppercase tracking-widest mb-4">
                                    Xbox
                                </span>
                                <h3 className="flex items-center gap-2 text-[16px] font-black text-white mb-1.5">
                                    <span className="w-4 h-4 rounded-full bg-[#107C10] flex items-center justify-center text-[8px] font-black text-white">X</span>
                                    Connect Xbox
                                </h3>
                                <p className="text-[12.5px] text-white/50 leading-relaxed">
                                    Just your gamertag — we import your played titles and achievements.
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400/80 group-hover:text-emerald-300">
                                    Connect <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>

                            {/* Manual path */}
                            <button onClick={() => { track("wizard_pick_started"); setMode("pick"); }}
                                className="group text-left rounded-[var(--radius-panel)] border border-[var(--line)] bg-white/[0.02] hover:bg-white/[0.05] p-6 transition-all md:col-span-2">
                                <h3 className="flex items-center gap-2 text-[15px] font-black text-white mb-1">
                                    <Gamepad2 className="w-4 h-4 text-[var(--accent)]" />
                                    No Steam or Xbox? Pick your games by hand
                                </h3>
                                <p className="text-[12.5px] text-white/50 leading-relaxed">
                                    Choose {PICK_TARGET} games you love. We use them to work out your taste — nothing here is guessed.
                                </p>
                            </button>
                        </div>

                        <button onClick={dismiss} className="mt-6 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white/60 transition-colors">
                            Skip for now
                        </button>
                    </div>
                ) : mode === "xbox" ? (
                    <div className="p-8 md:p-10">
                        <h2 className="text-xl font-black text-white mb-2">Connect your Xbox</h2>
                        <p className="text-[13px] text-white/50 mb-6 max-w-md">
                            Enter your gamertag — no password needed. We read your public played-titles list and achievements.
                        </p>
                        <div className="flex items-center gap-2 max-w-md">
                            <input
                                autoFocus
                                type="text"
                                value={xboxGamertag}
                                onChange={(e) => setXboxGamertag(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") connectXbox(); }}
                                placeholder="Your gamertag"
                                className="flex-1 bg-white/[0.03] border border-[var(--line)] rounded-[var(--radius-card)] h-12 px-4 text-[14px] text-white placeholder:text-white/45 focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                            <button onClick={connectXbox} disabled={connecting}
                                className="flex items-center gap-2 h-12 px-6 rounded-[var(--radius-card)] bg-[#107C10] hover:bg-[#0e6b0e] text-white text-[12px] font-bold uppercase tracking-wider transition-colors disabled:opacity-60">
                                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                Connect
                            </button>
                        </div>
                        <p className="mt-3 text-[11px] text-white/50">Your Xbox privacy must allow others to see your game history (default setting).</p>
                        <button onClick={() => setMode("choice")} className="mt-6 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white/60 transition-colors">
                            ← Back
                        </button>
                    </div>
                ) : (
                    <div className="p-8 md:p-10">
                        <div className="flex items-center justify-between mb-1 pr-8">
                            <h2 className="text-xl font-black text-white">Pick games you love</h2>
                            <span className="text-[13px] font-black text-[var(--accent)] tabular-nums">{added.length}/{PICK_TARGET}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-5">
                            <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (added.length / PICK_TARGET) * 100)}%` }} />
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent)]" />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search the catalogue…"
                                className="w-full bg-white/[0.03] border border-[var(--line)] rounded-[var(--radius-card)] h-12 pl-11 pr-4 text-[14px] text-white placeholder:text-white/45 focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                            />
                        </div>

                        <div className="h-[280px] overflow-y-auto space-y-1.5 pr-1">
                            {searching && !results && (
                                <div className="flex items-center justify-center h-full text-white/30">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            )}
                            {(results?.results ?? []).map((g) => {
                                const isAdded = added.includes(g.slug);
                                return (
                                    <button key={g.id} onClick={() => addGame(g)} disabled={isAdded || busySlug === g.slug}
                                        className={`w-full flex items-center gap-3 p-2 rounded-[var(--radius-card)] border transition-all text-left ${
                                            isAdded
                                                ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                                                : "border-transparent hover:border-[var(--accent)]/30 hover:bg-white/[0.03]"
                                        }`}>
                                        <div className="relative w-12 h-16 rounded-[var(--radius-card)] overflow-hidden bg-white/[0.04] shrink-0">
                                            {g.cover_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={g.cover_url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-white line-clamp-1">{g.name}</p>
                                            {g.released && <p className="text-[11px] text-white/50">{g.released.slice(0, 4)}</p>}
                                        </div>
                                        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                                            isAdded ? "bg-emerald-500 text-white" : "bg-white/[0.06] text-white/55"
                                        }`}>
                                            {busySlug === g.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        </span>
                                    </button>
                                );
                            })}
                            {debounced.length >= 2 && !searching && (results?.results ?? []).length === 0 && (
                                <p className="text-center text-[12px] text-white/50 pt-10">No games found for &quot;{debounced}&quot;</p>
                            )}
                            {debounced.length < 2 && (
                                <p className="text-center text-[12px] text-white/45 pt-10">Type at least 2 characters — try &quot;Elden&quot;, &quot;GTA&quot;, &quot;Zelda&quot;…</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-5">
                            <button onClick={() => setMode("choice")} className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white/60 transition-colors">
                                ← Back
                            </button>
                            <button onClick={finishPicking} disabled={added.length === 0}
                                className="flex items-center gap-2 h-[42px] px-6 rounded-[var(--radius-card)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[12px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                {added.length >= PICK_TARGET ? "Done" : `Done (${added.length})`}
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
