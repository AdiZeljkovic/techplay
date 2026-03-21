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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search forum..."
                    aria-label="Search forum threads and posts"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full py-2 pl-9 pr-8 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setIsOpen(false); }}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-[var(--text-muted)]">Searching...</div>
                    ) : totalResults === 0 ? (
                        <div className="p-4 text-center text-sm text-[var(--text-muted)]">No results for "{query}"</div>
                    ) : (
                        <>
                            {results!.threads.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-elevated)]">Threads</div>
                                    {results!.threads.map(t => (
                                        <Link
                                            key={t.id}
                                            href={`/forum/thread/${t.slug}`}
                                            onClick={() => { setIsOpen(false); setQuery(""); }}
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4 text-[var(--accent)] flex-shrink-0" aria-hidden="true" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{t.title}</div>
                                                <div className="text-xs text-[var(--text-muted)]">{t.category?.name} · {t.posts_count} replies</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {results!.posts.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-elevated)]">Posts</div>
                                    {results!.posts.map(p => (
                                        <Link
                                            key={p.id}
                                            href={`/forum/thread/${p.thread?.slug}`}
                                            onClick={() => { setIsOpen(false); setQuery(""); }}
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" aria-hidden="true" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-[var(--text-muted)] truncate">{p.thread?.title}</div>
                                                <div className="text-sm text-[var(--text-secondary)] line-clamp-1"
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
                                className="block px-3 py-2 text-xs text-center text-[var(--accent)] hover:bg-[var(--bg-elevated)] border-t border-[var(--border)] transition-colors"
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
