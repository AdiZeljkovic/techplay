"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { Search, MessageSquare, ArrowLeft } from "lucide-react";
import PageHero from "@/components/ui/PageHero";

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

    useEffect(() => {
        if (!q || q.length < 3) return;
        setIsLoading(true);
        axios.get(`/forum/search?q=${encodeURIComponent(q)}`)
            .then(res => setResults(res.data))
            .catch(() => setResults(null))
            .finally(() => setIsLoading(false));
    }, [q]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Link href="/forum" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Forum
            </Link>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : !results ? (
                <p className="text-[var(--text-muted)] text-center py-12">Enter at least 3 characters to search.</p>
            ) : (results.threads.length + results.posts.length === 0) ? (
                <div className="text-center py-16">
                    <Search className="w-14 h-14 text-[var(--text-muted)] mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No results found</h3>
                    <p className="text-[var(--text-muted)]">We couldn&apos;t find anything for &quot;{q}&quot;.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {results.threads.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
                                Threads ({results.threads.length})
                            </h2>
                            <div className="space-y-3">
                                {results.threads.map(t => (
                                    <Link key={t.id} href={`/forum/thread/${t.slug}`}
                                        className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] transition-all"
                                    >
                                        <h3 className="font-bold text-[var(--text-primary)] mb-1 hover:text-[var(--accent)] transition-colors">{t.title}</h3>
                                        <div className="text-xs text-[var(--text-muted)] flex gap-3">
                                            <span>{t.category?.name}</span>
                                            <span>·</span>
                                            <span>by {t.author?.username}</span>
                                            <span>·</span>
                                            <span>{t.posts_count} replies</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {results.posts.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
                                Posts ({results.posts.length})
                            </h2>
                            <div className="space-y-3">
                                {results.posts.map(p => (
                                    <Link key={p.id} href={`/forum/thread/${p.thread?.slug}`}
                                        className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] transition-all"
                                    >
                                        <div className="text-xs text-[var(--accent)] font-medium mb-1">{p.thread?.title}</div>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: p.content.replace(/<[^>]+>/g, '').substring(0, 200) }}
                                        />
                                        <div className="text-xs text-[var(--text-muted)] mt-2">by {p.author?.username}</div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ForumSearchPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero title="Forum Search" description="Search threads and posts" icon={Search} />
            <Suspense fallback={
                <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                    ))}
                </div>
            }>
                <ForumSearchResults />
            </Suspense>
        </div>
    );
}
