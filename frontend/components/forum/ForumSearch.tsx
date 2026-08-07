"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, MessageSquare, X } from "lucide-react";
import axios from "@/lib/axios";

interface SearchResult {
    threads: {
        id: number;
        title: string;
        slug: string;
        posts_count: number;
        category: { name: string; slug: string };
    }[];
    posts: {
        id: number;
        content: string;
        thread: { id: number; title: string; slug: string };
    }[];
    query: string;
}

export default function ForumSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (query.length < 3) {
            setResults(null);
            setIsOpen(false);
            return;
        }

        timerRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`/forum/search?q=${encodeURIComponent(query)}`);
                setResults(res.data);
                setIsOpen(true);
            } catch {
                setResults(null);
            } finally {
                setIsLoading(false);
            }
        }, 400);

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [query]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const totalResults = (results?.threads.length ?? 0) + (results?.posts.length ?? 0);

    return (
        <div ref={containerRef} className="relative w-full max-w-sm">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search forum..."
                    aria-label="Search forum threads and posts"
                    className="w-full bg-white dark:bg-[var(--surface-1)] border border-zinc-200 dark:border-white/[0.07] rounded-full h-[44px] pl-11 pr-9 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/35 focus:outline-none focus:border-[var(--accent)]/50 transition-all shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setIsOpen(false); }}
                        aria-label="Clear search"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-white/35 hover:text-[var(--accent)] transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[var(--surface-1)] border border-zinc-200 dark:border-white/[0.07] rounded-[var(--radius-card)] shadow-2xl dark:shadow-[0_20px_48px_rgba(0,0,0,0.6)] z-50 overflow-hidden max-h-80 overflow-y-auto">
                    <div className="h-[3px] bg-[var(--accent)] w-full sticky top-0" />
                    {isLoading ? (
                        <div className="p-4 text-center text-[13px] text-zinc-500 dark:text-white/35">Searching...</div>
                    ) : totalResults === 0 ? (
                        <div className="p-4 text-center text-[13px] text-zinc-500 dark:text-white/35">No results for "{query}"</div>
                    ) : (
                        <>
                            {results!.threads.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)] bg-zinc-50 dark:bg-white/[0.03]">Threads</div>
                                    {results!.threads.map(t => (
                                        <Link
                                            key={t.id}
                                            href={`/forum/thread/${t.slug}`}
                                            onClick={() => { setIsOpen(false); setQuery(""); }}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group"
                                        >
                                            <MessageSquare className="w-4 h-4 text-[var(--accent)] flex-shrink-0" aria-hidden="true" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] font-bold text-zinc-900 dark:text-white truncate group-hover:text-[var(--accent)] transition-colors">{t.title}</div>
                                                <div className="text-[11px] text-zinc-500 dark:text-white/35">{t.category?.name} · {t.posts_count} replies</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {results!.posts.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)] bg-zinc-50 dark:bg-white/[0.03]">Posts</div>
                                    {results!.posts.map(p => (
                                        <Link
                                            key={p.id}
                                            href={`/forum/thread/${p.thread?.slug}`}
                                            onClick={() => { setIsOpen(false); setQuery(""); }}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4 text-zinc-400 dark:text-white/35 flex-shrink-0" aria-hidden="true" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] text-zinc-500 dark:text-white/35 truncate">{p.thread?.title}</div>
                                                <div className="text-[13px] text-zinc-700 dark:text-white/45 line-clamp-1"
                                                    dangerouslySetInnerHTML={{ __html: p.content.replace(/<[^>]+>/g, '').substring(0, 80) + '...' }}
                                                />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={`/forum/search?q=${encodeURIComponent(query)}`}
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-center text-[var(--accent)] hover:bg-zinc-50 dark:hover:bg-white/5 border-t border-zinc-200 dark:border-white/[0.06] transition-colors"
                            >
                                See all results for "{query}"
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
