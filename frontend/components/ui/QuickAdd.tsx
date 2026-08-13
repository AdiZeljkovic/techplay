"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Plus, Search, Loader2, X, Gamepad2, BookOpen, ListPlus } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

interface GameHit {
    id: number;
    slug: string;
    name: string;
    cover_url?: string | null;
    released?: string | null;
}

/**
 * One button for the three things a member actually does.
 *
 * Adding a game meant being on the collection tab. Logging a session meant
 * being in the diary. Starting a list meant being on the lists tab. Each is a
 * thought that arrives while you are somewhere else entirely — reading a
 * review, scrolling the forum — and by the time you have navigated to the right
 * tab the thought has gone.
 *
 * Signed-out readers never see it: it is a shortcut to things that require an
 * account, and offering it would be an invitation to a locked door.
 */
export default function QuickAdd() {
    const { user } = useAuth();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState("");
    const [debounced, setDebounced] = useState("");
    const [adding, setAdding] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(term), 300);

        return () => clearTimeout(timer);
    }, [term]);

    // Escape closes it from anywhere, which is what people try first.
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const { data, isLoading } = useSWR<{ results?: GameHit[] }>(
        open && debounced.trim().length >= 2 ? `/games?search=${encodeURIComponent(debounced.trim())}&page_size=6` : null,
        fetcher,
        { keepPreviousData: true },
    );

    if (!user) return null;

    const results = data?.results ?? [];

    const addGame = async (game: GameHit, status: "playing" | "backlog") => {
        setAdding(game.slug);
        try {
            await axios.put(`/collection/games/${game.slug}`, { status });
            toast.success(`${game.name} → ${status === "playing" ? "Playing" : "Backlog"}`);
            setOpen(false);
            setTerm("");
        } catch {
            toast.error("Couldn't add that game.");
        } finally {
            setAdding(null);
        }
    };

    const go = (href: string) => {
        setOpen(false);
        setTerm("");
        router.push(href);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label="Quick add"
                className="fixed bottom-6 left-6 z-[60] w-12 h-12 rounded-full bg-[var(--accent)] hover:brightness-110 shadow-[0_10px_30px_rgba(0,0,0,0.55)] flex items-center justify-center text-white transition-[filter,transform] duration-300 hover:scale-105 active:scale-95"
            >
                <Plus className="w-5 h-5" />
            </button>

            {open && (
                <div className="fixed inset-0 z-[75] flex items-start justify-center px-4 pt-[12vh] bg-black/70 backdrop-blur-sm">
                    <button aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" />

                    <div className="relative w-full max-w-[520px] rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden">
                        <div className="relative border-b border-white/[0.06]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                            <input
                                autoFocus
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder="Search a game to add…"
                                className="w-full h-14 pl-11 pr-11 bg-transparent text-[14px] text-white placeholder:text-white/25 focus:outline-none"
                            />
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {debounced.trim().length >= 2 ? (
                            <div className="max-h-[340px] overflow-y-auto">
                                {isLoading && results.length === 0 ? (
                                    <p className="py-8 text-center"><Loader2 className="w-4 h-4 mx-auto animate-spin text-white/30" /></p>
                                ) : results.length === 0 ? (
                                    <p className="py-8 text-center text-[12.5px] text-white/30">Nothing found.</p>
                                ) : (
                                    results.map((game) => (
                                        <div key={game.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                                            {game.cover_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={game.cover_url} alt="" aria-hidden className="w-9 h-12 shrink-0 rounded-[4px] object-cover" />
                                            ) : (
                                                <span className="w-9 h-12 shrink-0 rounded-[4px] bg-white/[0.05] flex items-center justify-center">
                                                    <Gamepad2 className="w-4 h-4 text-white/20" />
                                                </span>
                                            )}

                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[13px] font-semibold text-white truncate">{game.name}</span>
                                                {game.released && (
                                                    <span className="block text-[10.5px] text-white/25">{game.released.slice(0, 4)}</span>
                                                )}
                                            </span>

                                            <span className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => addGame(game, "playing")}
                                                    disabled={adding !== null}
                                                    className="h-8 px-3 rounded-[7px] bg-[var(--accent)] hover:brightness-110 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-[filter] disabled:opacity-50"
                                                >
                                                    {adding === game.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Playing"}
                                                </button>
                                                <button
                                                    onClick={() => addGame(game, "backlog")}
                                                    disabled={adding !== null}
                                                    className="h-8 px-3 rounded-[7px] bg-white/[0.05] hover:bg-white/[0.1] font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/70 transition-colors disabled:opacity-50"
                                                >
                                                    Backlog
                                                </button>
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="p-2">
                                {[
                                    { icon: BookOpen, label: "Log a session", href: `/profile/${user.username}?tab=library` },
                                    { icon: ListPlus, label: "Start a list", href: `/profile/${user.username}?tab=lists` },
                                    { icon: Gamepad2, label: "Browse the database", href: "/games" },
                                ].map(({ icon: Icon, label, href }) => (
                                    <button
                                        key={label}
                                        onClick={() => go(href)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-white/[0.04] text-left transition-colors"
                                    >
                                        <Icon className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                                        <span className="text-[13px] font-semibold text-white">{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
