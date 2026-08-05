"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { Search, MessageSquare, ArrowLeft, AlertTriangle } from "lucide-react";

const fetcher = (url: string) => axios.get(url);

interface SearchResult {
    threads: {
        id: number;
        title: string;
        slug: string;
        posts_count: number;
        category: { name: string; slug: string };
        author: { username: string };
        created_at: string;
    }[];
    posts: {
        id: number;
        content: string;
        thread: { id: number; title: string; slug: string };
        author: { username: string };
        created_at: string;
    }[];
    query: string;
}

function ForumSearchResults() {
    const searchParams = useSearchParams();
    const q = searchParams.get("q") || "";
    const [results, setResults] = useState<SearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!q || q.length < 3) return;
        setIsLoading(true);
        setHasError(false);
        fetcher(`/forum/search?q=${encodeURIComponent(q)}`)
            .then(res => setResults(res.data))
            .catch(() => {
                setResults(null);
                setHasError(true);
            })
            .finally(() => setIsLoading(false));
    }, [q]);

    return (
        <div className="min-h-screen bg-[#060810]">
            <div className="bg-[#0B0E1A] border-b border-[#1A2030]">
                <div className="container-page py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-tp-accent rounded-2xl flex items-center justify-center shadow-lg shadow-tp-accent/30">
                            <Search className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Forum Search</h1>
                            <p className="text-[#9CA3AF]">Search threads and posts</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-page py-8">
                <Link href="/forum" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-tp-accent mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Forum
                </Link>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-[#0D1117] border border-[#1A2030] rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : hasError ? (
                    <div className="text-center py-16 bg-[#0D1117] border border-[#1A2030] rounded-2xl">
                        <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4 opacity-70" />
                        <h3 className="text-xl font-bold text-white mb-2">Search is temporarily unavailable</h3>
                        <p className="text-[#9CA3AF]">Something went wrong on our end. Please try again in a moment.</p>
                    </div>
                ) : !results ? (
                    <p className="text-[#9CA3AF] text-center py-12">Enter at least 3 characters to search.</p>
                ) : (results.threads.length + results.posts.length === 0) ? (
                    <div className="text-center py-16 bg-[#0D1117] border border-[#1A2030] rounded-2xl">
                        <Search className="w-14 h-14 text-[#3F3F46] mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                        <p className="text-[#9CA3AF]">We couldn&apos;t find anything for &quot;{q}&quot;.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {results.threads.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-tp-accent" aria-hidden="true" />
                                    Threads ({results.threads.length})
                                </h2>
                                <div className="space-y-3">
                                    {results.threads.map(t => (
                                        <Link key={t.id} href={`/forum/thread/${t.slug}`} className="block"
                                        >
                                            <div className="bg-[#0D1117] border border-[#1A2030] rounded-2xl p-4 hover:border-tp-accent/30 transition-all">
                                                <h3 className="font-bold text-white mb-1 hover:text-tp-accent transition-colors">{t.title}</h3>
                                                <div className="text-xs text-[#6B7280] flex gap-3">
                                                    <span>{t.category?.name}</span>
                                                    <span>&middot;</span>
                                                    <span>by {t.author?.username}</span>
                                                    <span>&middot;</span>
                                                    <span>{t.posts_count} replies</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {results.posts.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-[#6B7280]" aria-hidden="true" />
                                    Posts ({results.posts.length})
                                </h2>
                                <div className="space-y-3">
                                    {results.posts.map(p => (
                                        <Link key={p.id} href={`/forum/thread/${p.thread?.slug}`} className="block"
                                        >
                                            <div className="bg-[#0D1117] border border-[#1A2030] rounded-2xl p-4 hover:border-tp-accent/30 transition-all">
                                                <div className="text-xs text-tp-accent font-medium mb-1">{p.thread?.title}</div>
                                                <p className="text-sm text-[#9CA3AF] line-clamp-2">
                                                    {p.content.replace(/<[^>]+>/g, "").substring(0, 200)}
                                                </p>
                                                <div className="text-xs text-[#6B7280] mt-2">by {p.author?.username}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ForumSearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#060810] container-page py-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-[#0D1117] border border-[#1A2030] rounded-2xl animate-pulse" />
                ))}
            </div>
        }>
            <ForumSearchResults />
        </Suspense>
    );
}
