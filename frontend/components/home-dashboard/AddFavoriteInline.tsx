"use client";

import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import toast from "react-hot-toast";
import { Plus, Search, Star, Loader2, X, Gamepad2 } from "lucide-react";
import axios from "@/lib/axios";
import { useLibraryIndex } from "@/hooks/useLibraryIndex";

interface GameHit {
    slug: string;
    name: string;
    background_image: string | null;
    released?: string | null;
}

const searchFetcher = (url: string) =>
    axios.get(url).then((r) => (r.data?.results ?? []) as GameHit[]);

/** The user's own tracked games — the most likely favorites, offered first. */
const collectionFetcher = (url: string) =>
    axios.get(url).then((r) =>
        ((r.data?.data ?? []) as { game: GameHit }[]).map((e) => e.game).filter(Boolean)
    );

/**
 * Empty-state picker: search the catalog (or pick from your library) and star a
 * game without leaving the dashboard. Existing library entries keep their
 * status — only the favorite flag is flipped.
 */
export default function AddFavoriteInline({
    username,
    defaultOpen = false,
    onDismiss,
}: {
    username: string;
    /** Skip the prompt and show the search straight away (used from the "+" button). */
    defaultOpen?: boolean;
    onDismiss?: () => void;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [busySlug, setBusySlug] = useState<string | null>(null);
    const { library } = useLibraryIndex();
    const { mutate } = useSWRConfig();

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    const { data: results, isLoading: searching } = useSWR(
        open && debounced.length >= 2 ? `/games?search=${encodeURIComponent(debounced)}&page_size=8` : null,
        searchFetcher,
        { keepPreviousData: true }
    );

    const { data: mine } = useSWR(
        open && debounced.length < 2 ? `/users/${username}/collection?page_size=8` : null,
        collectionFetcher
    );

    const shown = debounced.length >= 2 ? results : mine;

    const star = async (game: GameHit) => {
        if (busySlug) return;
        setBusySlug(game.slug);
        try {
            await axios.put(`/collection/games/${game.slug}`, {
                // keep whatever status it already has; new games land in the backlog
                status: library[game.slug] ?? "backlog",
                is_favorite: true,
            });
            toast.success(`${game.name} added to favorites`);
            mutate("/me/dashboard");
            setQuery("");
            setOpen(false);
            onDismiss?.();
        } catch {
            toast.error("Couldn't add that game.");
        } finally {
            setBusySlug(null);
        }
    };

    if (!open) {
        return (
            <div className="flex-1 min-h-[104px] flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-center">
                <p className="text-[12.5px] font-semibold text-white/70">No favorites yet</p>
                <p className="text-[11px] text-white/35 -mt-1.5">Star the games you love — they show on your profile</p>
                <button
                    onClick={() => setOpen(true)}
                    className="mt-1 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--accent)] text-white text-[12px] font-bold hover:bg-[var(--accent-hover)] transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Add a favorite game
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-[104px] flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-black/30 border border-white/10 focus-within:border-[var(--accent)]/50 transition-colors">
                <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a game..."
                    className="flex-1 min-w-0 bg-transparent text-[12.5px] text-white placeholder:text-white/30 outline-none"
                />
                {searching && <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin shrink-0" />}
                <button onClick={() => { setOpen(false); setQuery(""); onDismiss?.(); }} aria-label="Cancel" className="shrink-0 text-white/35 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="mt-2 flex-1 overflow-y-auto max-h-[176px] scrollbar-none">
                {debounced.length < 2 && (mine?.length ?? 0) > 0 && (
                    <p className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">From your library</p>
                )}

                {shown?.map((g) => (
                    <button
                        key={g.slug}
                        onClick={() => star(g)}
                        disabled={busySlug !== null}
                        className="group w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left disabled:opacity-50"
                    >
                        <span className="relative w-[52px] h-[32px] rounded overflow-hidden shrink-0 bg-white/5">
                            {g.background_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={g.background_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-3 h-3 text-white/20" /></span>
                            )}
                        </span>
                        <span className="flex-1 min-w-0 text-[12px] font-semibold text-white truncate">{g.name}</span>
                        {busySlug === g.slug ? (
                            <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin shrink-0" />
                        ) : (
                            <Star className="w-3.5 h-3.5 text-white/20 group-hover:text-[var(--accent)] group-hover:fill-[var(--accent)] transition-colors shrink-0" />
                        )}
                    </button>
                ))}

                {debounced.length >= 2 && !searching && (results?.length ?? 0) === 0 && (
                    <p className="py-4 text-center text-[12px] text-white/35">No games found for “{debounced}”</p>
                )}
                {debounced.length < 2 && (mine?.length ?? 0) === 0 && (
                    <p className="py-4 text-center text-[12px] text-white/35">Type at least 2 letters to search</p>
                )}
            </div>
        </div>
    );
}
